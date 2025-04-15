import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding absence types...');

  // Clean up existing data if needed
  await prisma.absenceType.deleteMany();
  
  const absenceTypes = await prisma.absenceType.createMany({
    data: [
      {
        type_name: 'Marry',
        description: 'Marry leave',
        available_days: 3,
        deduct_from_allowed: false,
      },
      {
        type_name: 'Wife give birth naturally',
        description: 'Wife give birth naturally leave',
        available_days: 5,
        deduct_from_allowed: false,
      },
      {
        type_name: 'Wife gave birth by cesarean section',
        description: 'Wife gave birth by cesarean section leave',
        available_days: 7,
        deduct_from_allowed: false,
      },
    ],
    skipDuplicates: true, // Skip records that already exist
  });

  console.log(`Created ${absenceTypes.count} absence types`);
  
  // Log the created absence types for reference
  const createdTypes = await prisma.absenceType.findMany();
  createdTypes.forEach(type => {
    console.log(`- ${type.type_name} (ID: ${type.id}): ${type.available_days} days`);
  });
  
  console.log('Absence types seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding absence types:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });