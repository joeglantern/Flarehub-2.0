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

const SUPER_ADMIN_EMAIL = 'admin@flarehub.org';
const SUPER_ADMIN_PASSWORD = 'FlarehubAdmin2025!';

async function main() {
  console.log('Seeding database...');

  // 1. Create super admin in Supabase Auth
  let adminId: string;

  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingAdmin = existing.users.find((u) => u.email === SUPER_ADMIN_EMAIL);

  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log(`Super admin already exists: ${adminId}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email:         SUPER_ADMIN_EMAIL,
      password:      SUPER_ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Failed to create super admin: ${error?.message}`);
    }

    adminId = data.user.id;
    console.log(`Super admin created: ${adminId}`);
  }

  // 2. Upsert super admin in users table
  await prisma.user.upsert({
    where:  { id: adminId },
    update: { role: 'super_admin', isVerified: true, profileComplete: true },
    create: {
      id:              adminId,
      email:           SUPER_ADMIN_EMAIL,
      firstName:       'Flarehub',
      lastName:        'Admin',
      role:            'super_admin',
      isVerified:      true,
      profileComplete: true,
    },
  });

  // 3. Create initial programs
  await prisma.program.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      id:                     1,
      name:                   'Be Green Incubation & Mentorship Program',
      description:            'A program supporting young entrepreneurs in developing sustainable green business solutions.',
      status:                 'Inactive',
      tags:                   ['Climate', 'Waste', 'Sustainability'],
      eligibilityRequirements: 'Open to youth aged 18–35 with a green business idea.',
    },
  });

  await prisma.program.upsert({
    where:  { id: 2 },
    update: {},
    create: {
      id:                     2,
      name:                   'YOMA Youth Innovation Climate Challenge',
      description:            'A challenge program accelerating youth-led climate innovation projects.',
      status:                 'Active',
      tags:                   ['Climate', 'Energy', 'Innovation'],
      eligibilityRequirements: 'Open to youth aged 18–35 with a climate-focused business concept.',
      grantAmount:            250000,
    },
  });

  console.log('Programs seeded.');

  // 4. Create admin templates (metadata only)
  const templates = [
    {
      title:        'SMART Goals Template',
      description:  'Use this template to define your Specific, Measurable, Achievable, Relevant, and Time-bound goals.',
      originalName: 'SMART_Goals_Template.pdf',
      storagePath:  'templates/smart-goals-template.pdf',
      fileSize:     1024,
      fileType:     'application/pdf',
      templateType: 'smart_goals' as const,
    },
    {
      title:        'Milestone Plan Template',
      description:  'Document your 5-milestone implementation plan with timelines, budgets, and success metrics.',
      originalName: 'Milestone_Plan_Template.pdf',
      storagePath:  'templates/milestone-plan-template.pdf',
      fileSize:     1024,
      fileType:     'application/pdf',
      templateType: 'milestone' as const,
    },
    {
      title:        'Market Research Survey Template',
      description:  'Conduct structured market research with this standardized survey template.',
      originalName: 'Market_Research_Template.pdf',
      storagePath:  'templates/market-research-template.pdf',
      fileSize:     1024,
      fileType:     'application/pdf',
      templateType: 'market_research' as const,
    },
  ];

  for (const tmpl of templates) {
    const existing = await prisma.adminTemplate.findFirst({
      where: { title: tmpl.title },
    });
    if (!existing) {
      await prisma.adminTemplate.create({
        data: {
          ...tmpl,
          filename:    `seed-${tmpl.templateType}`,
          createdById: adminId,
        },
      });
    }
  }

  console.log('Admin templates seeded.');

  // 5. Default admin settings
  const defaultSettings: Array<{ key: string; value: string; description: string }> = [
    { key: 'site_name',        value: 'Flarehub',    description: 'Platform display name' },
    { key: 'maintenance_mode', value: 'false',        description: 'Set to true to enable maintenance mode' },
    { key: 'max_file_size_mb', value: '50',           description: 'Maximum file upload size in MB' },
    { key: 'support_email',    value: 'support@flarehub.org', description: 'Support contact email' },
  ];

  for (const s of defaultSettings) {
    await prisma.adminSetting.upsert({
      where:  { settingKey: s.key },
      update: {},
      create: { settingKey: s.key, settingValue: s.value, description: s.description },
    });
  }

  console.log('Admin settings seeded.');
  console.log('\nSeed complete.');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

