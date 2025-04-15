import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');
  
  // Clean up existing data if needed (optional)
  // Uncomment if want new data every time
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.position.deleteMany();
  
  // 1. Create roles
  console.log('Creating roles...');
  const roles = {
    admin: await prisma.role.upsert({
      where: { role_name: 'ADMIN' },
      update: {},
      create: {
        role_name: 'ADMIN',
        description: 'System administrator with full access',
      },
    }),
    user: await prisma.role.upsert({
      where: { role_name: 'USER' },
      update: {},
      create: {
        role_name: 'USER',
        description: 'Regular system user',
      },
    }),
    hr: await prisma.role.upsert({
      where: { role_name: 'HR' },
      update: {},
      create: {
        role_name: 'HR',
        description: 'Human resources personnel',
      },
    }),
    pm: await prisma.role.upsert({
      where: { role_name: 'PM' },
      update: {},
      create: {
        role_name: 'PM',
        description: 'Project manager',
      },
    }),
  };
  
  // 2. Create branches
  console.log('Creating branches...');
  const branches = {
    hanoi: await prisma.branch.upsert({
      where: { id: '' }, // Since there's no unique constraint other than ID, using a dummy value
      update: {},
      create: {
        branch_name: 'Hanoi',
        location: 'Hanoi, Vietnam',
      },
    }),
    hochiminh: await prisma.branch.upsert({
      where: { id: '' },
      update: {},
      create: {
        branch_name: 'Ho Chi Minh',
        location: 'Ho Chi Minh City, Vietnam',
      },
    }),
    danang: await prisma.branch.upsert({
      where: { id: '' },
      update: {},
      create: {
        branch_name: 'Da Nang',
        location: 'Da Nang, Vietnam',
      },
    }),
  };
  
  // 3. Create positions
  console.log('Creating positions...');
  const positions = {
    dev: await prisma.position.upsert({
      where: { position_name: 'Developer' },
      update: {},
      create: {
        position_name: 'Developer',
        description: 'Software developer',
      },
    }),
    designer: await prisma.position.upsert({
      where: { position_name: 'Designer' },
      update: {},
      create: {
        position_name: 'Designer',
        description: 'UI/UX designer',
      },
    }),
    tester: await prisma.position.upsert({
      where: { position_name: 'Tester' },
      update: {},
      create: {
        position_name: 'Tester',
        description: 'Quality assurance engineer',
      },
    }),
    pm: await prisma.position.upsert({
      where: { position_name: 'Project Manager' },
      update: {},
      create: {
        position_name: 'Project Manager',
        description: 'Project management professional',
      },
    }),
  };
  
  // Print created entities IDs for reference
  console.log('\nCreated Roles:');
  Object.entries(roles).forEach(([key, role]) => {
    console.log(`${key}: ${role.id}`);
  });
  
  console.log('\nCreated Branches:');
  Object.entries(branches).forEach(([key, branch]) => {
    console.log(`${key}: ${branch.id}`);
  });
  
  console.log('\nCreated Positions:');
  Object.entries(positions).forEach(([key, position]) => {
    console.log(`${key}: ${position.id}`);
  });
  
  // Generate a hash for the test password
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // Common password for all test users
  const defaultPassword = passwordHash;

  // 4. Create users
  console.log('\nCreating users...');
  const users = [
    {
      username: 'admin',
      password: defaultPassword,
      name: 'Admin',
      surname: 'User',
      email: 'admin@example.com',
      role_id: roles.admin.id,
      branch_id: branches.hanoi.id,
      position_id: positions.dev.id,
      start_date: new Date('2020-01-01'),
      allowed_leavedays: 15,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Hanoi, Vietnam',
      phone: '0123456789',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'johndoe',
      password: defaultPassword,
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      role_id: roles.user.id,
      branch_id: branches.hanoi.id,
      position_id: positions.dev.id,
      start_date: new Date('2021-03-15'),
      allowed_leavedays: 12,
      employee_type: 'FULLTIME',
      level: 'MIDDLE',
      address: 'Hanoi, Vietnam',
      phone: '0123456790',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'janesmith',
      password: defaultPassword,
      name: 'Jane',
      surname: 'Smith',
      email: 'jane.smith@example.com',
      role_id: roles.hr.id,
      branch_id: branches.hochiminh.id,
      position_id: positions.pm.id,
      start_date: new Date('2021-02-20'),
      allowed_leavedays: 14,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Ho Chi Minh City, Vietnam',
      phone: '0123456791',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'robertjohnson',
      password: defaultPassword,
      name: 'Robert',
      surname: 'Johnson',
      email: 'robert.johnson@example.com',
      role_id: roles.pm.id,
      branch_id: branches.danang.id,
      position_id: positions.pm.id,
      start_date: new Date('2021-01-10'),
      allowed_leavedays: 13,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Da Nang, Vietnam',
      phone: '0123456792',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'emilywilliams',
      password: defaultPassword,
      name: 'Emily',
      surname: 'Williams',
      email: 'emily.williams@example.com',
      role_id: roles.user.id,
      branch_id: branches.hanoi.id,
      position_id: positions.designer.id,
      start_date: new Date('2021-04-05'),
      allowed_leavedays: 10,
      employee_type: 'FULLTIME',
      level: 'JUNIOR',
      address: 'Hanoi, Vietnam',
      phone: '0123456793',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'michaelbrown',
      password: defaultPassword,
      name: 'Michael',
      surname: 'Brown',
      email: 'michael.brown@example.com',
      role_id: roles.user.id,
      branch_id: branches.hochiminh.id,
      position_id: positions.tester.id,
      start_date: new Date('2021-05-15'),
      allowed_leavedays: 10,
      employee_type: 'FULLTIME',
      level: 'MIDDLE',
      address: 'Ho Chi Minh City, Vietnam',
      phone: '0123456794',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'sarahdavis',
      password: defaultPassword,
      name: 'Sarah',
      surname: 'Davis',
      email: 'sarah.davis@example.com',
      role_id: roles.user.id,
      branch_id: branches.danang.id,
      position_id: positions.dev.id,
      start_date: new Date('2021-06-01'),
      allowed_leavedays: 10,
      employee_type: 'FULLTIME',
      level: 'JUNIOR',
      address: 'Da Nang, Vietnam',
      phone: '0123456795',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'davidmiller',
      password: defaultPassword,
      name: 'David',
      surname: 'Miller',
      email: 'david.miller@example.com',
      role_id: roles.user.id,
      branch_id: branches.hanoi.id,
      position_id: positions.dev.id,
      start_date: new Date('2021-07-10'),
      allowed_leavedays: 10,
      employee_type: 'PARTTIME',
      level: 'MIDDLE',
      address: 'Hanoi, Vietnam',
      phone: '0123456796',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'lisawilson',
      password: defaultPassword,
      name: 'Lisa',
      surname: 'Wilson',
      email: 'lisa.wilson@example.com',
      role_id: roles.user.id,
      branch_id: branches.hochiminh.id,
      position_id: positions.designer.id,
      start_date: new Date('2021-08-15'),
      allowed_leavedays: 10,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Ho Chi Minh City, Vietnam',
      phone: '0123456797',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'jamesmoore',
      password: defaultPassword,
      name: 'James',
      surname: 'Moore',
      email: 'james.moore@example.com',
      role_id: roles.user.id,
      branch_id: branches.danang.id,
      position_id: positions.tester.id,
      start_date: new Date('2021-09-01'),
      allowed_leavedays: 10,
      employee_type: 'FULLTIME',
      level: 'JUNIOR',
      address: 'Da Nang, Vietnam',
      phone: '0123456798',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'jennifertaylor',
      password: defaultPassword,
      name: 'Jennifer',
      surname: 'Taylor',
      email: 'jennifer.taylor@example.com',
      role_id: roles.user.id,
      branch_id: branches.hanoi.id,
      position_id: positions.dev.id,
      start_date: new Date('2022-01-10'),
      allowed_leavedays: 8,
      employee_type: 'FULLTIME',
      level: 'MIDDLE',
      address: 'Hanoi, Vietnam',
      phone: '0123456799',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'thomasanderson',
      password: defaultPassword,
      name: 'Thomas',
      surname: 'Anderson',
      email: 'thomas.anderson@example.com',
      role_id: roles.user.id,
      branch_id: branches.hochiminh.id,
      position_id: positions.dev.id,
      start_date: new Date('2022-02-15'),
      allowed_leavedays: 8,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Ho Chi Minh City, Vietnam',
      phone: '0123456800',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'jessicawhite',
      password: defaultPassword,
      name: 'Jessica',
      surname: 'White',
      email: 'jessica.white@example.com',
      role_id: roles.user.id,
      branch_id: branches.danang.id,
      position_id: positions.designer.id,
      start_date: new Date('2022-03-01'),
      allowed_leavedays: 8,
      employee_type: 'FULLTIME',
      level: 'MIDDLE',
      address: 'Da Nang, Vietnam',
      phone: '0123456801',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'danielharris',
      password: defaultPassword,
      name: 'Daniel',
      surname: 'Harris',
      email: 'daniel.harris@example.com',
      role_id: roles.user.id,
      branch_id: branches.hanoi.id,
      position_id: positions.tester.id,
      start_date: new Date('2022-04-15'),
      allowed_leavedays: 8,
      employee_type: 'FULLTIME',
      level: 'JUNIOR',
      address: 'Hanoi, Vietnam',
      phone: '0123456802',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'amandamartin',
      password: defaultPassword,
      name: 'Amanda',
      surname: 'Martin',
      email: 'amanda.martin@example.com',
      role_id: roles.user.id,
      branch_id: branches.hochiminh.id,
      position_id: positions.dev.id,
      start_date: new Date('2022-05-01'),
      allowed_leavedays: 8,
      employee_type: 'PARTTIME',
      level: 'MIDDLE',
      address: 'Ho Chi Minh City, Vietnam',
      phone: '0123456803',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'ryanclark',
      password: defaultPassword,
      name: 'Ryan',
      surname: 'Clark',
      email: 'ryan.clark@example.com',
      role_id: roles.user.id,
      branch_id: branches.danang.id,
      position_id: positions.dev.id,
      start_date: new Date('2022-06-15'),
      allowed_leavedays: 8,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Da Nang, Vietnam',
      phone: '0123456804',
      sex: 'MALE',
      is_active: true,
    },
    {
      username: 'stephaniewalker',
      password: defaultPassword,
      name: 'Stephanie',
      surname: 'Walker',
      email: 'stephanie.walker@example.com',
      role_id: roles.hr.id,
      branch_id: branches.hanoi.id,
      position_id: positions.pm.id,
      start_date: new Date('2022-07-01'),
      allowed_leavedays: 12,
      employee_type: 'FULLTIME',
      level: 'MIDDLE',
      address: 'Hanoi, Vietnam',
      phone: '0123456805',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'kevinlewis',
      password: defaultPassword,
      name: 'Kevin',
      surname: 'Lewis',
      email: 'kevin.lewis@example.com',
      role_id: roles.user.id,
      branch_id: branches.hochiminh.id,
      position_id: positions.designer.id,
      start_date: new Date('2022-08-15'),
      allowed_leavedays: 8,
      employee_type: 'FULLTIME',
      level: 'JUNIOR',
      address: 'Ho Chi Minh City, Vietnam',
      phone: '0123456806',
      sex: 'MALE',
      is_active: false,  // Inactive user example
    },
    {
      username: 'melissahall',
      password: defaultPassword,
      name: 'Melissa',
      surname: 'Hall',
      email: 'melissa.hall@example.com',
      role_id: roles.user.id,
      branch_id: branches.danang.id,
      position_id: positions.tester.id,
      start_date: new Date('2022-09-01'),
      allowed_leavedays: 8,
      employee_type: 'PARTTIME',
      level: 'MIDDLE',
      address: 'Da Nang, Vietnam',
      phone: '0123456807',
      sex: 'FEMALE',
      is_active: true,
    },
    {
      username: 'christopheradams',
      password: defaultPassword,
      name: 'Christopher',
      surname: 'Adams',
      email: 'christopher.adams@example.com',
      role_id: roles.pm.id,
      branch_id: branches.hanoi.id,
      position_id: positions.pm.id,
      start_date: new Date('2022-10-15'),
      allowed_leavedays: 12,
      employee_type: 'FULLTIME',
      level: 'SENIOR',
      address: 'Hanoi, Vietnam',
      phone: '0123456808',
      sex: 'MALE',
      is_active: true,
    }
  ];

  // Create all users using upsert to avoid duplicates
  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { username: user.username },
        update: {},
        create: user,
      });
      console.log(`Created user: ${user.username}`);
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
  }
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });