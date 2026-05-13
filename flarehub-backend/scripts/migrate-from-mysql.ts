import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { config } from 'dotenv';
config();

const SQL_DUMP_PATH = 'C:\\Users\\liban\\OneDrive\\Desktop\\Projects\\Flarehub Rebuild\\flarehub-backend\\yhrqzzlw_flarehub.sql';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const prisma = new PrismaClient();

type RawRow = Record<string, string | null>;

function parseSqlDump(sql: string): Map<string, RawRow[]> {
  const tableMap = new Map<string, RawRow[]>();
  const insertRegex = /INSERT INTO `?(\w+)`?\s+\(([^)]+)\)\s+VALUES\s*([\s\S]+?);/gi;

  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsPart = match[2];
    const valuesPart = match[3];

    const columns = columnsPart
      .split(',')
      .map((c) => c.trim().replace(/`/g, ''));

    const rowMatches = valuesPart.matchAll(/\(([^)]*(?:'[^']*'[^)]*)*)\)/g);

    if (!tableMap.has(tableName)) tableMap.set(tableName, []);
    const rows = tableMap.get(tableName)!;

    for (const rowMatch of rowMatches) {
      const rawValues = parseRowValues(rowMatch[1]);
      if (rawValues.length !== columns.length) continue;

      const row: RawRow = {};
      columns.forEach((col, i) => {
        const val = rawValues[i];
        row[col] = val === 'NULL' ? null : val.replace(/^'|'$/g, '').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      });
      rows.push(row);
    }
  }

  return tableMap;
}

function parseRowValues(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    if (char === "'" && row[i - 1] !== '\\') {
      inString = !inString;
      current += char;
    } else if (char === ',' && !inString) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  values.push(current.trim());
  return values;
}

function toDate(val: string | null): Date | null {
  if (!val || val === '0000-00-00 00:00:00' || val === '0000-00-00') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseJson(val: string | null): unknown {
  if (!val) return null;
  try {
    // Unescape MySQL escaped quotes and backslashes inside JSON strings
    const cleaned = val
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
}

async function main() {
  console.log('Reading SQL dump...');
  const sql = readFileSync(SQL_DUMP_PATH, 'utf-8');
  const tables = parseSqlDump(sql);

  console.log('Tables found:', [...tables.keys()].join(', '));

  const idMap = new Map<number, string>();
  const orphanCounts: Record<string, number> = {};

  // Step 1: Create Supabase Auth users
  const users = tables.get('users') ?? [];
  console.log(`\nImporting ${users.length} users to Supabase Auth...`);
  let authSuccess = 0;
  const passwordResetNeeded: string[] = [];

  // Fetch all existing auth users once to check for duplicates
  const { data: existingAuthData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthMap = new Map(existingAuthData.users.map((u) => [u.email?.toLowerCase(), u.id]));

  for (const row of users) {
    if (!row.email) continue;
    const emailLower = row.email.toLowerCase();

    // Already exists in Supabase Auth — just map the ID
    if (existingAuthMap.has(emailLower)) {
      idMap.set(parseInt(row.id!), existingAuthMap.get(emailLower)!);
      authSuccess++;
      continue;
    }

    // Convert PHP bcrypt prefix $2y$ → $2b$ (Supabase expects $2b$)
    const rawHash = row.password ?? null;
    const passwordHash = rawHash?.startsWith('$2y$')
      ? rawHash.replace('$2y$', '$2b$')
      : rawHash ?? undefined;

    try {
      // Try with password_hash first (preserves existing passwords)
      const { data, error } = await supabase.auth.admin.createUser({
        email:         row.email,
        password_hash: passwordHash,
        email_confirm: true,
        user_metadata: { first_name: row.first_name ?? '', last_name: row.last_name ?? '' },
      });

      if (error || !data.user) {
        // Fallback: create with a temporary password — user will need to reset
        const tempPassword = `Flarehub_${Math.random().toString(36).slice(2, 10)}!`;
        const { data: fallback, error: fallbackErr } = await supabase.auth.admin.createUser({
          email:         row.email,
          password:      tempPassword,
          email_confirm: true,
          user_metadata: { first_name: row.first_name ?? '', last_name: row.last_name ?? '' },
        });

        if (fallbackErr || !fallback.user) {
          console.warn(`  Failed ${row.email}: ${fallbackErr?.message ?? error?.message}`);
          continue;
        }

        idMap.set(parseInt(row.id!), fallback.user.id);
        passwordResetNeeded.push(row.email);
        authSuccess++;
      } else {
        idMap.set(parseInt(row.id!), data.user.id);
        authSuccess++;
      }
    } catch (err) {
      console.warn(`  Error creating user ${row.email}:`, err);
    }
  }
  console.log(`  Auth users created/found: ${authSuccess}/${users.length}`);
  if (passwordResetNeeded.length > 0) {
    console.log(`  ⚠ ${passwordResetNeeded.length} users got temp passwords (hash import failed) — they need to reset:`);
    passwordResetNeeded.forEach((e) => console.log(`    - ${e}`));
  }

  // Step 2: Insert users table
  console.log('\nInserting users table...');
  let userSuccess = 0;
  for (const row of users) {
    const oldId = parseInt(row.id!);
    const newId = idMap.get(oldId);
    if (!newId) { orphanCounts.users = (orphanCounts.users ?? 0) + 1; continue; }

    try {
      await prisma.user.upsert({
        where: { id: newId },
        update: {},
        create: {
          id:              newId,
          email:           row.email!,
          firstName:       row.first_name ?? '',
          lastName:        row.last_name ?? '',
          phone:           row.phone ?? null,
          county:          row.county ?? null,
          businessName:    row.business_name ?? null,
          businessDescription: row.business_description ?? null,
          isVerified:      row.is_verified === '1',
          profileComplete: row.profile_complete === '1',
          createdAt:       toDate(row.created_at) ?? new Date(),
        },
      });
      userSuccess++;
    } catch (err) {
      console.warn(`  Skipping user row ${row.email}:`, err);
    }
  }
  console.log(`  Users inserted: ${userSuccess}`);

  // Also map admins table IDs → their user IDs (applications may reference admins)
  const admins = tables.get('admins') ?? [];
  for (const row of admins) {
    if (!row.email) continue;
    const emailLower = row.email.toLowerCase();
    const existing = existingAuthMap.get(emailLower);
    if (existing) {
      idMap.set(parseInt(row.id!), existing);
    }
  }

  // Step 3: Programs
  const programs = tables.get('programs') ?? [];
  console.log(`\nInserting ${programs.length} programs...`);
  const programIdMap = new Map<number, number>();
  for (const row of programs) {
    try {
      const p = await prisma.program.upsert({
        where: { id: parseInt(row.id!) },
        update: {},
        create: {
          id:                     parseInt(row.id!),
          name:                   row.name!,
          description:            row.description ?? null,
          applicationDeadline:    toDate(row.application_deadline),
          status:                 (row.status === 'Active' ? 'Active' : 'Inactive'),
          maxParticipants:        row.max_participants ? parseInt(row.max_participants) : null,
          grantAmount:            row.grant_amount ? parseFloat(row.grant_amount) : null,
          eligibilityRequirements: row.eligibility_requirements ?? null,
          tags:                   row.tags ? (parseJson(row.tags) as string[] ?? []) : [],
          createdAt:              toDate(row.created_at) ?? new Date(),
        },
      });
      programIdMap.set(parseInt(row.id!), p.id);
    } catch (err) {
      console.warn(`  Skipping program ${row.name}:`, err);
    }
  }
  console.log(`  Programs inserted: ${programIdMap.size}`);

  // Step 4: Applications
  const applications = tables.get('applications') ?? [];
  console.log(`\nInserting ${applications.length} applications...`);
  let appSuccess = 0;
  const seenApps = new Set<string>();
  for (const row of applications) {
    const userId = idMap.get(parseInt(row.user_id ?? row.userId ?? '0'));
    const programId = programIdMap.get(parseInt(row.program_id ?? row.programId ?? '0'));
    if (!userId || !programId) { orphanCounts.applications = (orphanCounts.applications ?? 0) + 1; continue; }

    const key = `${userId}-${programId}`;
    if (seenApps.has(key)) continue;
    seenApps.add(key);

    try {
      await prisma.application.upsert({
        where: { userId_programId: { userId, programId } },
        update: {},
        create: {
          userId,
          programId,
          status:    (['Pending','UnderReview','Approved','Rejected'].includes(row.status ?? '') ? row.status as 'Pending' : 'Pending'),
          appliedAt: toDate(row.applied_at ?? row.created_at) ?? new Date(),
        },
      });
      appSuccess++;
    } catch (err) {
      console.warn(`  Skipping application:`, err);
    }
  }
  console.log(`  Applications inserted: ${appSuccess}`);

  // Step 5: Smart Goals
  const smartGoals = tables.get('smart_goals') ?? [];
  console.log(`\nInserting ${smartGoals.length} smart goals...`);
  let sgSuccess = 0;
  for (const row of smartGoals) {
    const userId = idMap.get(parseInt(row.user_id ?? '0'));
    if (!userId) { orphanCounts.smart_goals = (orphanCounts.smart_goals ?? 0) + 1; continue; }
    try {
      await prisma.smartGoal.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          goalStatement: row.goal_statement ?? '',
          specific:      row.specific ?? '',
          measurable:    row.measurable ?? '',
          achievable:    row.achievable ?? '',
          relevant:      row.relevant ?? '',
          timebound:     row.timebound ?? '',
          adminComment:  row.admin_comment ?? null,
          commentedAt:   toDate(row.commented_at),
          createdAt:     toDate(row.created_at) ?? new Date(),
        },
      });
      sgSuccess++;
    } catch (err) {
      console.warn(`  Skipping smart goal:`, err);
    }
  }
  console.log(`  Smart goals inserted: ${sgSuccess}`);

  // Step 6: Milestone Plans — flatten 35 columns to JSON
  const milestonePlans = tables.get('milestone_plans') ?? [];
  console.log(`\nInserting ${milestonePlans.length} milestone plans...`);
  let mpSuccess = 0;
  for (const row of milestonePlans) {
    const userId = idMap.get(parseInt(row.user_id ?? '0'));
    if (!userId) { orphanCounts.milestone_plans = (orphanCounts.milestone_plans ?? 0) + 1; continue; }

    const milestones = [1, 2, 3, 4, 5].map((n) => ({
      number:   n,
      title:    row[`milestone${n}_title`] ?? '',
      timeline: row[`milestone${n}_timeline`] ?? '',
      budget:   row[`milestone${n}_budget`] ?? '',
      goal:     row[`milestone${n}_goal`] ?? '',
      tasks:    row[`milestone${n}_tasks`] ?? '',
      evidence: row[`milestone${n}_evidence`] ?? '',
      metrics:  row[`milestone${n}_metrics`] ? (row[`milestone${n}_metrics`] as string).split(',').map((m) => m.trim()) : [],
    }));

    try {
      await prisma.milestonePlan.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          businessName:         row.business_name ?? '',
          grantAmount:          row.grant_amount ?? null,
          implementationPeriod: row.implementation_period ?? null,
          stage:                row.stage ?? null,
          milestones,
          adminComment:         row.admin_comment ?? null,
          commentedAt:          toDate(row.commented_at),
          createdAt:            toDate(row.created_at) ?? new Date(),
        },
      });
      mpSuccess++;
    } catch (err) {
      console.warn(`  Skipping milestone plan:`, err);
    }
  }
  console.log(`  Milestone plans inserted: ${mpSuccess}`);

  // Step 7: Market Research
  const marketResearch = tables.get('market_research') ?? [];
  console.log(`\nInserting ${marketResearch.length} market research entries...`);
  let mrSuccess = 0;
  for (const row of marketResearch) {
    const userId = idMap.get(parseInt(row.user_id ?? '0'));
    if (!userId) { orphanCounts.market_research = (orphanCounts.market_research ?? 0) + 1; continue; }
    try {
      await prisma.marketResearch.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          businessName:         row.business_name ?? '',
          surveyDate:           toDate(row.survey_date),
          sampleSize:           row.sample_size ?? null,
          surveyObjective:      row.survey_objective ?? null,
          ageDistribution:      row.age_distribution ?? null,
          genderBreakdown:      row.gender_breakdown ?? null,
          location:             row.location ?? null,
          topChallenges:        (parseJson(row.top_challenges) ?? undefined) as Prisma.InputJsonValue | undefined,
          awareness:            row.awareness ?? null,
          interest:             row.interest ?? null,
          avgWillingness:       row.avg_willingness ?? null,
          priceRange:           row.price_range ?? null,
          currentSolutions:     row.current_solutions ?? null,
          openComments:         row.open_comments ?? null,
          opportunity1:         row.opportunity1 ?? null,
          opportunity2:         row.opportunity2 ?? null,
          riskBarrier:          row.risk_barrier ?? null,
          nextSteps:            (parseJson(row.next_steps) ?? undefined) as Prisma.InputJsonValue | undefined,
          adminComment:         row.admin_comment ?? null,
          commentedAt:          toDate(row.commented_at),
          createdAt:            toDate(row.created_at) ?? new Date(),
        },
      });
      mrSuccess++;
    } catch (err) {
      console.warn(`  Skipping market research:`, err);
    }
  }
  console.log(`  Market research inserted: ${mrSuccess}`);

  // Step 8: Business Plans
  // Old schema has no user_id column — the plan's own `id` equals the user's old int id.
  // Additionally, plan_data JSON may contain an "id" field with the user id.
  const businessPlans = tables.get('business_plans') ?? [];
  console.log(`\nInserting ${businessPlans.length} business plans...`);
  let bpSuccess = 0;
  for (const row of businessPlans) {
    // Try user_id column first, then fall back to plan id, then plan_data.id
    const parsedPlan = parseJson(row.plan_data) as Record<string, unknown> | null;
    const candidateIds = [
      parseInt(row.user_id ?? '0'),
      parseInt(row.id ?? '0'),
      parseInt(String(parsedPlan?.id ?? '0')),
    ];
    let userId: string | undefined;
    for (const candidate of candidateIds) {
      if (candidate > 0 && idMap.has(candidate)) {
        userId = idMap.get(candidate);
        break;
      }
    }
    if (!userId) { orphanCounts.business_plans = (orphanCounts.business_plans ?? 0) + 1; continue; }
    try {
      const planData = (parsedPlan ?? { raw: row.plan_data }) as Prisma.InputJsonValue;
      await prisma.businessPlan.upsert({
        where:  { userId },
        update: {},
        create: { userId, planData, createdAt: toDate(row.created_at) ?? new Date() },
      });
      bpSuccess++;
    } catch (err) {
      console.warn(`  Skipping business plan:`, err);
    }
  }
  console.log(`  Business plans inserted: ${bpSuccess}`);

  // Step 9: Mentor Mentees
  const mentorMentees = tables.get('mentor_mentees') ?? [];
  console.log(`\nInserting ${mentorMentees.length} mentor assignments...`);
  let mmSuccess = 0;
  for (const row of mentorMentees) {
    const mentorId = idMap.get(parseInt(row.mentor_id ?? '0'));
    const menteeId = idMap.get(parseInt(row.mentee_id ?? '0'));
    if (!mentorId || !menteeId) { orphanCounts.mentor_mentees = (orphanCounts.mentor_mentees ?? 0) + 1; continue; }
    try {
      await prisma.mentorMentee.upsert({
        where: { mentorId_menteeId: { mentorId, menteeId } },
        update: {},
        create: { mentorId, menteeId, assignedAt: toDate(row.assigned_at) ?? new Date() },
      });
      mmSuccess++;
    } catch (err) {
      console.warn(`  Skipping mentor assignment:`, err);
    }
  }
  console.log(`  Mentor assignments inserted: ${mmSuccess}`);

  // Step 10: Messages
  const messages = tables.get('messages') ?? [];
  console.log(`\nInserting ${messages.length} messages...`);
  let msgSuccess = 0;
  for (const row of messages) {
    const senderId = idMap.get(parseInt(row.sender_id ?? '0'));
    const receiverId = idMap.get(parseInt(row.receiver_id ?? '0'));
    if (!senderId || !receiverId) { orphanCounts.messages = (orphanCounts.messages ?? 0) + 1; continue; }
    try {
      await prisma.message.create({
        data: {
          senderId,
          receiverId,
          content:   row.content ?? '',
          isRead:    row.is_read === '1',
          createdAt: toDate(row.created_at) ?? new Date(),
        },
      });
      msgSuccess++;
    } catch (err) {
      console.warn(`  Skipping message:`, err);
    }
  }
  console.log(`  Messages inserted: ${msgSuccess}`);

  // Step 11: Admin Settings
  const adminSettings = tables.get('admin_settings') ?? [];
  console.log(`\nInserting ${adminSettings.length} admin settings...`);
  let asSuccess = 0;
  for (const row of adminSettings) {
    try {
      await prisma.adminSetting.upsert({
        where:  { settingKey: row.setting_key ?? row.key! },
        update: { settingValue: row.setting_value ?? row.value ?? '' },
        create: {
          settingKey:   row.setting_key ?? row.key!,
          settingValue: row.setting_value ?? row.value ?? '',
          description:  row.description ?? null,
        },
      });
      asSuccess++;
    } catch (err) {
      console.warn(`  Skipping admin setting:`, err);
    }
  }
  console.log(`  Admin settings inserted: ${asSuccess}`);

  console.log('\n═══════════════════════════════');
  console.log('Migration Summary');
  console.log('═══════════════════════════════');
  console.log(`Auth users created: ${authSuccess}`);
  console.log(`Users inserted:     ${userSuccess}`);
  console.log(`Programs inserted:  ${programIdMap.size}`);
  console.log(`Applications:       ${appSuccess}`);
  console.log(`Smart goals:        ${sgSuccess}`);
  console.log(`Milestone plans:    ${mpSuccess}`);
  console.log(`Market research:    ${mrSuccess}`);
  console.log(`Business plans:     ${bpSuccess}`);
  console.log(`Mentor assignments: ${mmSuccess}`);
  console.log(`Messages:           ${msgSuccess}`);
  console.log(`Admin settings:     ${asSuccess}`);
  if (Object.keys(orphanCounts).length > 0) {
    console.log('\nOrphaned rows skipped:');
    for (const [table, count] of Object.entries(orphanCounts)) {
      console.log(`  ${table}: ${count}`);
    }
  }

  await prisma.$disconnect();
  console.log('\nMigration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
