const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database through Prisma ORM...\n');

    // Check users count
    const userCount = await prisma.user.count();
    console.log(`👥 Total users: ${userCount}`);

    // Check projects count
    const projectCount = await prisma.project.count();
    console.log(`🏗️  Total projects: ${projectCount}`);

    // Check user-project assignments count
    const assignmentCount = await prisma.userProject.count();
    console.log(`🔗 Total user-project assignments: ${assignmentCount}\n`);

    // Show some users
    console.log('👥 Sample users:');
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        surname: true,
        is_active: true,
      },
    });
    users.forEach((user) => {
      console.log(
        `  - ${user.name} ${user.surname} (${user.username}) - Active: ${user.is_active}`,
      );
      console.log(`    ID: ${user.id}`);
    });

    // Show some projects
    console.log('\n🏗️  Sample projects:');
    const projects = await prisma.project.findMany({
      take: 3,
      select: {
        id: true,
        project_name: true,
        project_code: true,
        status: true,
      },
    });
    projects.forEach((project) => {
      console.log(
        `  - ${project.project_name} (${project.project_code}) - Status: ${project.status}`,
      );
      console.log(`    ID: ${project.id}`);
    });

    // Show user-project assignments
    console.log('\n🔗 Sample user-project assignments:');
    const assignments = await prisma.userProject.findMany({
      take: 5,
      include: {
        user: {
          select: {
            username: true,
            name: true,
            surname: true,
          },
        },
        project: {
          select: {
            project_name: true,
            project_code: true,
            status: true,
          },
        },
      },
    });

    if (assignments.length === 0) {
      console.log('  ❌ No user-project assignments found!');
    } else {
      assignments.forEach((assignment) => {
        console.log(
          `  - ${assignment.user.name} ${assignment.user.surname} → ${assignment.project.project_name} (${assignment.project.project_code})`,
        );
        console.log(
          `    Assignment ID: ${assignment.id}, Project Status: ${assignment.project.status}`,
        );
      });
    }

    // Check assignments for a specific user (if we have users)
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(
        `\n🔍 Projects assigned to ${firstUser.name} ${firstUser.surname}:`,
      );

      const userAssignments = await prisma.userProject.findMany({
        where: {
          user_id: firstUser.id,
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              status: true,
            },
          },
        },
      });

      if (userAssignments.length === 0) {
        console.log('  ❌ No projects assigned to this user!');
      } else {
        userAssignments.forEach((assignment) => {
          console.log(
            `  - ${assignment.project.project_name} (${assignment.project.project_code}) - Status: ${assignment.project.status}`,
          );
        });
      }
    }
  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
