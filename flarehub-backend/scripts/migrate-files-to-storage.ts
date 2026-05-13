import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const prisma = new PrismaClient();

const BUCKET_MAP: Record<string, string> = {
  documents:   process.env.STORAGE_BUCKET_DOCUMENTS   ?? 'documents',
  evidence:    process.env.STORAGE_BUCKET_EVIDENCE     ?? 'evidence',
  templates:   process.env.STORAGE_BUCKET_TEMPLATES    ?? 'templates',
  submissions: process.env.STORAGE_BUCKET_SUBMISSIONS  ?? 'submissions',
};

async function uploadFile(
  localPath: string,
  bucket: string,
  storagePath: string,
  mimeType: string,
): Promise<boolean> {
  if (!existsSync(localPath)) return false;

  const fileBuffer = readFileSync(localPath);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

  return !error;
}

async function main() {
  const summary = {
    documents:   { success: 0, missing: 0, total: 0 },
    evidence:    { success: 0, missing: 0, total: 0 },
    templates:   { success: 0, missing: 0, total: 0 },
    submissions: { success: 0, missing: 0, total: 0 },
  };

  // Documents
  const documents = await prisma.document.findMany();
  summary.documents.total = documents.length;
  console.log(`\nMigrating ${documents.length} documents...`);
  for (const doc of documents) {
    const localPath = doc.storagePath;
    const newPath = `${doc.userId}/${doc.filename}`;
    const uploaded = await uploadFile(localPath, BUCKET_MAP.documents, newPath, doc.fileType);
    if (uploaded) {
      await prisma.document.update({ where: { id: doc.id }, data: { storagePath: newPath } });
      summary.documents.success++;
    } else {
      console.warn(`  Missing file: ${localPath}`);
      summary.documents.missing++;
    }
  }

  // Evidence
  const evidences = await prisma.evidence.findMany();
  summary.evidence.total = evidences.length;
  console.log(`\nMigrating ${evidences.length} evidence files...`);
  for (const ev of evidences) {
    const localPath = ev.storagePath;
    const newPath = `${ev.userId}/${ev.fileName}`;
    const uploaded = await uploadFile(localPath, BUCKET_MAP.evidence, newPath, ev.mimeType);
    if (uploaded) {
      await prisma.evidence.update({ where: { id: ev.id }, data: { storagePath: newPath } });
      summary.evidence.success++;
    } else {
      console.warn(`  Missing file: ${localPath}`);
      summary.evidence.missing++;
    }
  }

  // Templates
  const templates = await prisma.adminTemplate.findMany();
  summary.templates.total = templates.length;
  console.log(`\nMigrating ${templates.length} admin templates...`);
  for (const tmpl of templates) {
    const localPath = tmpl.storagePath;
    const newPath = `${tmpl.filename}`;
    const uploaded = await uploadFile(localPath, BUCKET_MAP.templates, newPath, tmpl.fileType);
    if (uploaded) {
      await prisma.adminTemplate.update({ where: { id: tmpl.id }, data: { storagePath: newPath } });
      summary.templates.success++;
    } else {
      console.warn(`  Missing file: ${localPath}`);
      summary.templates.missing++;
    }
  }

  // User submissions
  const userSubs = await prisma.userSubmission.findMany();
  summary.submissions.total = userSubs.length;
  console.log(`\nMigrating ${userSubs.length} user submissions...`);
  for (const sub of userSubs) {
    const localPath = sub.storagePath;
    const newPath = `${sub.userId}/${sub.filename}`;
    const uploaded = await uploadFile(localPath, BUCKET_MAP.submissions, newPath, sub.fileType);
    if (uploaded) {
      await prisma.userSubmission.update({ where: { id: sub.id }, data: { storagePath: newPath } });
      summary.submissions.success++;
    } else {
      console.warn(`  Missing file: ${localPath}`);
      summary.submissions.missing++;
    }
  }

  console.log('\n═══════════════════════════════');
  console.log('File Migration Summary');
  console.log('═══════════════════════════════');
  for (const [bucket, counts] of Object.entries(summary)) {
    console.log(`${bucket}: ${counts.success}/${counts.total} uploaded, ${counts.missing} missing`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('File migration failed:', err);
  process.exit(1);
});
