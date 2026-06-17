const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.program.create({
  data: {
    name: 'Sheria ya Vijana!',
    description: 'EU-funded 12-month mentorship programme empowering youth in Nairobi and Kwale to lead Kenya\'s green and digital transition. Participants are matched with experienced mentors, track business milestones, and access programme resources through Flarehub.',
    status: 'Active',
    tags: ['mentorship', 'entrepreneurship', 'green economy', 'digital', 'youth'],
    maxParticipants: 100,
    eligibilityRequirements: 'Youth aged 15-29 in Nairobi and Kwale counties with an early-stage business in the green or digital sector.',
  },
})
.then(r => console.log('Created program ID:', r.id, '|', r.name))
.catch(e => console.error('Error:', e.message))
.finally(() => prisma.$disconnect());
