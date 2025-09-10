import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RoleMigrationSummary {
  roleName: string;
  beforePermissions: number;
  afterPermissions: number;
  addedPermissions: string[];
  removedPermissions: string[];
}

/**
 * Migration script to update existing roles with the new granular permission system
 * This script can be run safely multiple times - it will check current state and only make necessary changes
 */
async function migrateRolesToNewPermissionSystem(): Promise<
  RoleMigrationSummary[]
> {
  console.log('🔄 Starting role permission migration...\n');

  try {
    // Get all roles and permissions
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const allPermissions = await prisma.permission.findMany();

    // Create permission lookup maps
    const permissionsByName = allPermissions.reduce(
      (acc, perm) => {
        acc[perm.name] = perm;
        return acc;
      },
      {} as Record<string, any>,
    );

    const rolesByName = roles.reduce(
      (acc, role) => {
        acc[role.role_name] = role;
        return acc;
      },
      {} as Record<string, any>,
    );

    const migrationSummary: RoleMigrationSummary[] = [];

    // Define the new permission mappings for each role
    const newRolePermissionMappings = {
      ADMIN: Object.keys(permissionsByName), // Admin gets all permissions

      PM: [
        // Dashboard & Profile
        'VIEW_DASHBOARD',
        'VIEW_PROFILE',
        'EDIT_PROFILE',

        // Personal features
        'VIEW_PERSONAL_TIMESHEET',
        'EDIT_PERSONAL_TIMESHEET',
        'DELETE_PERSONAL_TIMESHEET',
        'VIEW_PERSONAL_REQUESTS',
        'CREATE_REQUESTS',
        'EDIT_PERSONAL_REQUESTS',
        'DELETE_PERSONAL_REQUESTS',
        'VIEW_TEAM_CALENDAR',
        'VIEW_PERSONAL_WORKING_TIME',
        'EDIT_PERSONAL_WORKING_TIME',

        // Management features
        'VIEW_MANAGEMENT_TEAM_BUILDING',
        'VIEW_MANAGEMENT_REPORTS',
        'VIEW_TEAM_REQUESTS',
        'APPROVE_REQUESTS',
        'EDIT_TEAM_REQUESTS',
        'VIEW_TEAM_TIMESHEETS',
        'APPROVE_TIMESHEETS',
        'EDIT_TEAM_TIMESHEETS',
        'VIEW_WEEK_SUBMISSIONS',
        'APPROVE_WEEK_SUBMISSIONS',
        'VIEW_TIMESHEET_MONITORING',
        'VIEW_MANAGEMENT_PROJECTS',
        'MANAGE_PROJECTS',
        'VIEW_TEAM_WORKING_TIMES',
        'MANAGE_TEAM_WORKING_TIMES',
        'VIEW_RETROSPECTIVE',
        'VIEW_INTERN_REVIEWS',
        'MANAGE_INTERN_REVIEWS',

        // Limited admin access
        'VIEW_ADMIN_USERS',
        'VIEW_ADMIN_BRANCHES',
        'VIEW_ADMIN_POSITIONS',
      ],

      HR: [
        // Dashboard & Profile
        'VIEW_DASHBOARD',
        'VIEW_PROFILE',
        'EDIT_PROFILE',

        // User management
        'VIEW_ADMIN_USERS',
        'CREATE_USER',
        'EDIT_USER',
        'VIEW_ADMIN_BRANCHES',
        'MANAGE_BRANCHES',
        'VIEW_ADMIN_POSITIONS',
        'MANAGE_POSITIONS',

        // Personal features
        'VIEW_PERSONAL_TIMESHEET',
        'EDIT_PERSONAL_TIMESHEET',
        'DELETE_PERSONAL_TIMESHEET',
        'VIEW_PERSONAL_REQUESTS',
        'CREATE_REQUESTS',
        'EDIT_PERSONAL_REQUESTS',
        'DELETE_PERSONAL_REQUESTS',
        'VIEW_TEAM_CALENDAR',
        'VIEW_PERSONAL_WORKING_TIME',
        'EDIT_PERSONAL_WORKING_TIME',

        // HR-specific management
        'VIEW_MANAGEMENT_REPORTS',
        'VIEW_TEAM_REQUESTS',
        'APPROVE_REQUESTS',
        'EDIT_TEAM_REQUESTS',
        'VIEW_TEAM_TIMESHEETS',
        'VIEW_WEEK_SUBMISSIONS',
        'VIEW_TEAM_WORKING_TIMES',
        'MANAGE_TEAM_WORKING_TIMES',
        'VIEW_PROFILE_CHANGES',
        'APPROVE_PROFILE_CHANGES',

        // Admin features
        'VIEW_ADMIN_LEAVE_TYPES',
        'MANAGE_LEAVE_TYPES',
        'VIEW_ADMIN_OFFDAY_SETTINGS',
        'MANAGE_OFFDAY_SETTINGS',
      ],

      USER: [
        // Dashboard & Profile
        'VIEW_DASHBOARD',
        'VIEW_PROFILE',
        'EDIT_PROFILE',

        // Personal features only
        'VIEW_PERSONAL_TIMESHEET',
        'EDIT_PERSONAL_TIMESHEET',
        'DELETE_PERSONAL_TIMESHEET',
        'VIEW_PERSONAL_REQUESTS',
        'CREATE_REQUESTS',
        'EDIT_PERSONAL_REQUESTS',
        'DELETE_PERSONAL_REQUESTS',
        'VIEW_TEAM_CALENDAR',
        'VIEW_PERSONAL_WORKING_TIME',
        'EDIT_PERSONAL_WORKING_TIME',
      ],
    };

    // Process each role
    for (const [roleName, requiredPermissions] of Object.entries(
      newRolePermissionMappings,
    )) {
      const role = rolesByName[roleName];
      if (!role) {
        console.log(`⚠️  Role '${roleName}' not found, skipping...`);
        continue;
      }

      console.log(`\n🔍 Processing role: ${roleName}`);

      // Get current permissions for this role
      const currentPermissions = role.permissions.map(
        (rp: any) => rp.permission.name,
      );
      const currentPermissionIds = role.permissions.map(
        (rp: any) => rp.permission.id,
      );

      // Calculate required permission IDs
      const requiredPermissionIds = requiredPermissions
        .map((permName) => permissionsByName[permName]?.id)
        .filter(Boolean);

      // Find permissions to add and remove
      const permissionsToAdd = requiredPermissionIds.filter(
        (permId: string) => !currentPermissionIds.includes(permId),
      );
      const permissionsToRemove = currentPermissionIds.filter(
        (permId: string) => !requiredPermissionIds.includes(permId),
      );

      // Get permission names for logging
      const addedPermissionNames = permissionsToAdd.map(
        (permId: string) =>
          allPermissions.find((p) => p.id === permId)?.name || 'Unknown',
      );
      const removedPermissionNames = permissionsToRemove.map(
        (permId: string) =>
          allPermissions.find((p) => p.id === permId)?.name || 'Unknown',
      );

      console.log(`   Current permissions: ${currentPermissions.length}`);
      console.log(`   Required permissions: ${requiredPermissions.length}`);
      console.log(`   To add: ${permissionsToAdd.length}`);
      console.log(`   To remove: ${permissionsToRemove.length}`);

      // Remove outdated permissions
      if (permissionsToRemove.length > 0) {
        await prisma.rolePermission.deleteMany({
          where: {
            role_id: role.id,
            permission_id: { in: permissionsToRemove },
          },
        });
        console.log(
          `   ✅ Removed ${permissionsToRemove.length} outdated permissions`,
        );
      }

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        const newRolePermissions = permissionsToAdd.map(
          (permissionId: string) => ({
            role_id: role.id,
            permission_id: permissionId,
          }),
        );

        await prisma.rolePermission.createMany({
          data: newRolePermissions,
        });
        console.log(`   ✅ Added ${permissionsToAdd.length} new permissions`);
      }

      // Store summary
      migrationSummary.push({
        roleName,
        beforePermissions: currentPermissions.length,
        afterPermissions: requiredPermissions.length,
        addedPermissions: addedPermissionNames,
        removedPermissions: removedPermissionNames,
      });

      if (permissionsToAdd.length === 0 && permissionsToRemove.length === 0) {
        console.log(`   ✅ Role ${roleName} is already up to date`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log('====================');

    migrationSummary.forEach((summary) => {
      console.log(`\n${summary.roleName}:`);
      console.log(
        `  📈 Permissions: ${summary.beforePermissions} → ${summary.afterPermissions}`,
      );

      if (summary.addedPermissions.length > 0) {
        console.log(`  ➕ Added: ${summary.addedPermissions.join(', ')}`);
      }

      if (summary.removedPermissions.length > 0) {
        console.log(`  ➖ Removed: ${summary.removedPermissions.join(', ')}`);
      }
    });

    console.log('\n✅ Role permission migration completed successfully!');
    return migrationSummary;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Validate that all users have access to required permissions through their roles
 */
async function validateUserPermissions() {
  console.log('\n🔍 Validating user permissions...');

  const users = await prisma.user.findMany({
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const validationResults = users.map((user) => {
    const permissionCount = user.role?.permissions?.length || 0;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.role_name || 'No Role',
      permissionCount,
      hasPermissions: permissionCount > 0,
    };
  });

  console.log('\n👥 User Permission Summary:');
  console.log('==========================');

  validationResults.forEach((result) => {
    const status = result.hasPermissions ? '✅' : '❌';
    console.log(
      `${status} ${result.username} (${result.role}): ${result.permissionCount} permissions`,
    );
  });

  const usersWithoutPermissions = validationResults.filter(
    (r) => !r.hasPermissions,
  );

  if (usersWithoutPermissions.length > 0) {
    console.log(
      `\n⚠️  Found ${usersWithoutPermissions.length} users without permissions!`,
    );
    return false;
  } else {
    console.log('\n✅ All users have appropriate permissions!');
    return true;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Role & Permission Migration System');
  console.log('===============================================\n');

  try {
    // Run migration
    const migrationSummary = await migrateRolesToNewPermissionSystem();

    // Validate results
    const validationPassed = await validateUserPermissions();

    console.log('\n🎉 Migration process completed!');
    console.log(`📋 Migrated ${migrationSummary.length} roles`);
    console.log(
      `${validationPassed ? '✅' : '❌'} User validation: ${validationPassed ? 'PASSED' : 'FAILED'}`,
    );
  } catch (error) {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { migrateRolesToNewPermissionSystem, validateUserPermissions };
