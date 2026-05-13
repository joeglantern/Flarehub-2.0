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

const MENTOR_EMAIL    = 'joeglantern12@gmail.com';
const MENTOR_PASSWORD = 'joeyflow';

async function main() {
  console.log('Seeding mentor user...');

  // ── 1. Create or find in Supabase Auth ───────────────────────────────────
  let mentorId: string;

  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === MENTOR_EMAIL);

  if (existing) {
    mentorId = existing.id;
    console.log(`Auth user already exists — updating password. ID: ${mentorId}`);
    await supabase.auth.admin.updateUserById(mentorId, { password: MENTOR_PASSWORD });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email:         MENTOR_EMAIL,
      password:      MENTOR_PASSWORD,
      email_confirm: true,          // skip email verification
    });
    if (error || !data.user) throw new Error(`Failed to create auth user: ${error?.message}`);
    mentorId = data.user.id;
    console.log(`Auth user created. ID: ${mentorId}`);
  }

  // ── 2. Upsert in Prisma ───────────────────────────────────────────────────
  const record = await prisma.user.upsert({
    where:  { id: mentorId },
    update: {
      role:            'mentor',
      isMentor:        true,
      isVerified:      true,
      profileComplete: true,
    },
    create: {
      id:              mentorId,
      email:           MENTOR_EMAIL,
      firstName:       'Joe',
      lastName:        'Glantern',
      role:            'mentor',
      isMentor:        true,
      isVerified:      true,
      profileComplete: true,
    },
  });

  console.log(`✓ Mentor seeded — ${record.email} (${record.id})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

//seeded myself to get a mentor account for testing.
