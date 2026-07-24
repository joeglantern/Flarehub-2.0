import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import { AppError } from '../../types/index.js';
import { getSignedDownloadUrl } from '../../services/storage.service.js';
import { appConfig } from '../../config/index.js';
import { format } from 'fast-csv';
import type { FormSchema, FormResponse, FieldResponseValue, FileResponseValue } from '../../types/applicationForm.js';

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

function isFileValue(v: unknown): v is FileResponseValue {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'filePath' in v && 'fileName' in v;
}

// After resolveFileUrls runs, a resolved file's filePath is an absolute signed
// URL — surface that directly so it's a clickable link in the spreadsheet.
// If signing failed, fall back to the filename with a clear "unavailable" flag
// rather than a bare storage key that looks like a broken link.
function fieldValueToString(val: FieldResponseValue): string {
  if (isFileValue(val)) {
    return /^https?:\/\//i.test(val.filePath) ? val.filePath : `${val.fileName} (unavailable)`;
  }
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

async function resolveFileUrls(
  supabase: FastifyInstance['supabase'],
  fields: Record<string, FieldResponseValue>,
  expiresIn = 3600,
): Promise<Record<string, FieldResponseValue>> {
  const out = { ...fields };
  await Promise.all(
    Object.entries(out).map(async ([key, val]) => {
      if (isFileValue(val) && val.filePath && !/^https?:\/\//i.test(val.filePath)) {
        try {
          const url = await getSignedDownloadUrl(supabase, appConfig.storage.buckets.submissions, val.filePath, expiresIn);
          out[key] = { ...val, filePath: url };
        } catch {
          // leave raw path if signing fails — callers must treat non-http filePath as unavailable
        }
      }
    }),
  );
  return out;
}

const listQuerySchema = z.object({
  page:          z.coerce.number().int().positive().default(1),
  limit:         z.coerce.number().int().positive().max(100).default(20),
  status:        z.enum(['Pending', 'UnderReview', 'Approved', 'Rejected']).optional(),
  programId:     z.coerce.number().int().positive().optional(),
  applicationId: z.coerce.number().int().positive().optional(),
  search:        z.string().optional(),
  from:          z.string().optional(),
  to:            z.string().optional(),
});

type Query = z.infer<typeof listQuerySchema>;

function buildWhere(q: Query): Prisma.ApplicationWhereInput {
  return {
    isDraft: false,
    program: { applicationForm: { not: Prisma.JsonNull } },
    ...(q.applicationId && { id: q.applicationId }),
    ...(q.status         && { status:    q.status }),
    ...(q.programId      && { programId: q.programId }),
    ...(q.search && {
      OR: [
        { user: { firstName: { contains: q.search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: q.search, mode: 'insensitive' } } },
        { user: { email:     { contains: q.search, mode: 'insensitive' } } },
      ],
    }),
    ...((q.from || q.to) && {
      submittedAt: {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to   && { lte: new Date(q.to) }),
      },
    }),
  };
}

function slugifyName(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function formSubmissionsRoutes(fastify: FastifyInstance) {

  // ── GET /admin/form-submissions ───────────────────────────────────────────────
  fastify.get('/admin/form-submissions', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const q    = listQuerySchema.parse(request.query);
    const skip = (q.page - 1) * q.limit;
    const where = buildWhere(q);

    const [total, rows] = await Promise.all([
      fastify.prisma.application.count({ where }),
      fastify.prisma.application.findMany({
        where,
        skip,
        take:    q.limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user:    { select: { id: true, firstName: true, lastName: true, email: true, phone: true, county: true } },
          program: { select: { id: true, name: true } },
          score:   true,
        },
      }),
    ]);

    const data = rows.map(a => ({
      id:           a.id,
      status:       a.status,
      submittedAt:  a.submittedAt,
      appliedAt:    a.appliedAt,
      adminComment: a.adminComment,
      user:         a.user,
      program:      { id: a.program.id, name: a.program.name },
      score:        a.score,
      fieldCount:   Object.keys((a.responses as FormResponse | null)?.fields ?? {}).length,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
    });
  });

  // ── GET /admin/form-submissions/export ────────────────────────────────────────
  fastify.get('/admin/form-submissions/export', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const q     = listQuerySchema.parse(request.query);
    const where = buildWhere(q);

    const rows = await fastify.prisma.application.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        user:    { select: { firstName: true, lastName: true, email: true, phone: true, county: true } },
        program: { select: { name: true, applicationForm: true } },
      },
    });

    // When filtering by a single program (or a single application), derive
    // dynamic columns from that program's schema so each form field gets its
    // own column instead of a raw JSON blob.
    let schema: FormSchema | null = null;
    if ((q.programId || q.applicationId) && rows[0]?.program?.applicationForm) {
      schema = rows[0].program.applicationForm as unknown as FormSchema;
    }

    const fieldCols: { id: string; label: string }[] = [];
    if (schema) {
      for (const section of schema.sections ?? []) {
        for (const field of section.fields ?? []) {
          fieldCols.push({ id: field.id, label: field.label });
        }
      }
    }

    const baseHeaders = ['id', 'applicant', 'email', 'phone', 'county', 'program', 'status', 'submittedAt'];
    const headers     = schema ? [...baseHeaders, ...fieldCols.map(f => f.label)] : [...baseHeaders, 'responses'];

    // Resolve every file field to a long-lived signed URL so links in the
    // spreadsheet actually work when opened later, instead of exposing raw
    // storage keys.
    const resolvedFieldsByRow = await Promise.all(
      rows.map(a => resolveFileUrls(fastify.supabase, (a.responses as FormResponse | null)?.fields ?? {}, SEVEN_DAYS_SECONDS)),
    );

    const csvRows = rows.map((a, i) => {
      const fields = resolvedFieldsByRow[i];
      const row: Record<string, unknown> = {
        id:          a.id,
        applicant:   `${a.user.firstName} ${a.user.lastName}`,
        email:       a.user.email,
        phone:       a.user.phone ?? '',
        county:      a.user.county ?? '',
        program:     a.program.name,
        status:      a.status,
        submittedAt: a.submittedAt?.toISOString() ?? '',
      };
      if (schema) {
        for (const col of fieldCols) {
          row[col.label] = fields[col.id] !== undefined ? fieldValueToString(fields[col.id]) : '';
        }
      } else {
        row['responses'] = JSON.stringify(fields);
      }
      return row;
    });

    const csv = await new Promise<string>((resolve, reject) => {
      const chunks: string[] = [];
      const stream = format({ headers });
      stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
      stream.on('end',  () => resolve(chunks.join('')));
      stream.on('error', reject);
      for (const row of csvRows) stream.write(row);
      stream.end();
    });

    const filename = q.applicationId && rows[0]
      ? `${slugifyName(rows[0].user.firstName, rows[0].user.lastName)}-submission.csv`
      : 'form-submissions.csv';

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // ── GET /admin/form-submissions/:id ──────────────────────────────────────────
  fastify.get('/admin/form-submissions/:id', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const raw = (request.params as { id: string }).id;
    const appId = parseInt(raw, 10);
    if (isNaN(appId)) throw new AppError('INVALID_ID', 'Invalid submission ID', 400);

    const app = await fastify.prisma.application.findUnique({
      where:   { id: appId },
      include: {
        user:    {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            phone: true, county: true, gender: true,
            businessName: true, businessStage: true, profilePic: true,
          },
        },
        program: { select: { id: true, name: true, applicationForm: true } },
        score:   true,
      },
    });

    if (!app) throw new AppError('NOT_FOUND', 'Submission not found', 404);
    if (!app.program.applicationForm) throw new AppError('NO_FORM', 'This program does not have a form', 400);

    let fields = (app.responses as FormResponse | null)?.fields ?? {};
    fields = await resolveFileUrls(fastify.supabase, fields);

    return reply.send({
      success: true,
      data: {
        id:           app.id,
        status:       app.status,
        submittedAt:  app.submittedAt,
        appliedAt:    app.appliedAt,
        adminComment: app.adminComment,
        user:         app.user,
        program:      { id: app.program.id, name: app.program.name },
        formSchema:   app.program.applicationForm as unknown as FormSchema,
        responses:    { version: 1 as const, fields },
        score:        app.score,
      },
    });
  });
}
