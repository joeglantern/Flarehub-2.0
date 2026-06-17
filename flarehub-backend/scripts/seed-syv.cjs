const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('programs', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM programs"
  );

  const p = await prisma.program.create({
    data: {
      name: 'Sheria ya Vijana!',
      description: "EU-funded 12-month mentorship programme empowering youth in Nairobi and Kwale to lead Kenya's green and digital transition. Participants are matched with experienced mentors, track business milestones, and access programme resources through Flarehub.",
      status: 'Active',
      tags: ['mentorship', 'entrepreneurship', 'green economy', 'digital', 'youth'],
      maxParticipants: 100,
      eligibilityRequirements: 'Youth aged 15-29 in Nairobi and Kwale counties with an early-stage business in the green or digital sector.',
    },
  });

  console.log('Created program ID:', p.id, '|', p.name);
}

main().catch(e => console.error('Error:', e.message)).finally(() => prisma.$disconnect());
