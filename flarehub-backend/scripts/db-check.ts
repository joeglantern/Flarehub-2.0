import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MENTEE_NAMES = [
  'Bibi Said Mwakileo', 'Mejumaa Kibwana Mwamtsere', 'Swalehe Vyombo',
  'Oprah Claries', 'Peter Mutahi Wacuka', 'Patience Kanga',
  'Meselemani Kazimwenga', 'Susanna Maingi', 'Priscah Mongera',
  'Mary Munyao', 'Swabrina Omar Abdalla', 'Nyawa Chibogo',
  'Zawadi juma Beba', 'Alice Loiton', 'Bilali Abdalla Bilali',
  'Elias Dindi Chabai', 'Naima Ringi Ali', 'Samuel Kioko Nzioka',
  'Franc Paul Apiyo', 'Rebecca Barawa', 'Sylvester Ondoro',
  'Lilian Gatuna', 'Fauzia Ali Mwakuphaka', 'Mercy muthoni',
  'Mbodze Mealii Swazuri', 'Julia Mumbe', 'David Muema',
];

async function main() {
  // Find Magdaline Watahi
  console.log('=== Mentor: Magdaline Watahi ===');
  const mentor = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'mwatahi@stemimpactcenterkenya.org' },
        { firstName: { contains: 'Magdaline', mode: 'insensitive' } },
      ]
    },
  });
  console.log(mentor
    ? `Found: ${mentor.firstName} ${mentor.lastName} | id=${mentor.id} | isMentor=${mentor.isMentor}`
    : 'NOT FOUND on platform');

  // Find mentees
  console.log('\n=== Mentees on platform ===');
  const found: { id: string; name: string; original: string }[] = [];

  for (const fullName of MENTEE_NAMES) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0];
    const last  = parts[parts.length - 1];

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            firstName: { contains: first, mode: 'insensitive' },
            lastName:  { contains: last,  mode: 'insensitive' },
          },
          { firstName: { contains: fullName, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (users.length > 0) {
      for (const u of users) {
        console.log(`  ✓ "${fullName}" → ${u.firstName} ${u.lastName} <${u.email}> id=${u.id}`);
        found.push({ id: u.id, name: `${u.firstName} ${u.lastName}`, original: fullName });
      }
    } else {
      console.log(`  ✗ "${fullName}" — not found`);
    }
  }

  console.log(`\nFound ${found.length} matches out of ${MENTEE_NAMES.length} names.`);

  // Existing assignments are tracked via MentorMentee records (see match-magdaline.ts)
}

main().catch(console.error).finally(() => prisma.$disconnect());
