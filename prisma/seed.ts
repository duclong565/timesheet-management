import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding process...');

  // Clean up existing data
  await cleanDatabase();

  // 1. Create Roles
  console.log('Creating roles...');
  const roles = await seedRoles();

  // 2. Create Permissions
  console.log('Creating permissions...');
  const permissions = await seedPermissions();

  // 3. Create Role-Permission relationships
  console.log('Assigning permissions to roles...');
  await seedRolePermissions(roles, permissions);

  // 4. Create Branches
  console.log('Creating branches...');
  const branches = await seedBranches();

  // 5. Create Positions
  console.log('Creating positions...');
  const positions = await seedPositions();

  // 6. Create Capabilities
  console.log('Creating capabilities...');
  const capabilities = await seedCapabilities();

  // 7. Create Capability Settings
  console.log('Creating capability settings...');
  await seedCapabilitySettings(positions, capabilities);

  // 8. Create Users
  console.log('Creating users...');
  const users = await seedUsers(roles, branches, positions);

  // 9. Create Working Times
  console.log('Creating working times...');
  await seedWorkingTimes(users);

  // 10. Create Clients
  console.log('Creating clients...');
  const clients = await seedClients();

  // 11. Create Projects
  console.log('Creating projects...');
  const projects = await seedProjects(clients);

  // 12. Create User-Project relationships
  console.log('Assigning users to projects...');
  await seedUserProjects(users, projects);

  // 13. Create Tasks
  console.log('Creating tasks...');
  const tasks = await seedTasks(projects);

  // 14. Create Absence Types
  console.log('Creating absence types...');
  const absenceTypes = await seedAbsenceTypes();

  // 15. Create Offday Settings
  console.log('Creating offday settings...');
  await seedOffdaySettings();

  // 16. Create Project OT Settings
  console.log('Creating project OT settings...');
  await seedProjectOtSettings(projects);

  // 17. Create Timesheets
  console.log('Creating timesheets...');
  const timesheets = await seedTimesheets(users, projects, tasks);

  // 18. Create Timesheet Complaints
  console.log('Creating timesheet complaints...');
  await seedTimesheetComplaints(timesheets);

  // 19. Create Requests
  console.log('Creating requests...');
  const requests = await seedRequests(users, projects, absenceTypes);

  // 20. Create Audit Logs
  console.log('Creating audit logs...');
  await seedAuditLogs(users, requests, timesheets);

  console.log('Seeding completed successfully!');
}

async function cleanDatabase() {
  // Map table names to their corresponding Prisma model names
  const tableModelMap: Record<string, string> = {
    audit_logs: 'auditLog',
    requests: 'request',
    timesheet_complaints: 'timesheetComplaint',
    timesheets: 'timesheet',
    project_ot_settings: 'projectOtSetting',
    offday_settings: 'offdaySetting',
    tasks: 'task',
    users_project: 'userProject',
    projects: 'project',
    clients: 'client',
    working_times: 'workingTime',
    capability_settings: 'capabilitySetting',
    capabilities: 'capability',
    absence_types: 'absenceType',
    role_permissions: 'rolePermission',
    permissions: 'permission',
    users: 'user',
    positions: 'position',
    branches: 'branch',
    roles: 'role',
  };

  // Process tables in reverse order to respect foreign key constraints
  const tablesToClean = Object.keys(tableModelMap).reverse();

  // Try to truncate all tables
  for (const table of tablesToClean) {
    try {
      const modelName = tableModelMap[table];
      // Skip database clearing in development to preserve data
      // await (prisma as any)[modelName].deleteMany({});
      console.log(`Skipped clearing ${table} table (for data preservation)`);
    } catch (error) {
      console.warn(`Failed to clear ${table} table:`, error);
    }
  }
}

async function seedRoles() {
  const roleData = [
    {
      role_name: 'ADMIN',
      description: 'System administrator with full access',
    },
    { role_name: 'PM', description: 'Project manager' },
    { role_name: 'HR', description: 'Human resources personnel' },
    { role_name: 'USER', description: 'Regular system user' },
  ];

  const roles: Record<string, any> = {};

  for (const role of roleData) {
    const result = await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: role,
    });
    roles[role.role_name.toLowerCase()] = result;
  }

  return roles;
}

async function seedPermissions() {
  const permissionData = [
    // Dashboard
    {
      name: 'VIEW_DASHBOARD',
      description: 'Access dashboard page',
      category: 'DASHBOARD',
    },

    // Profile
    {
      name: 'VIEW_PROFILE',
      description: 'View profile information',
      category: 'PROFILE',
    },
    {
      name: 'EDIT_PROFILE',
      description: 'Edit profile information',
      category: 'PROFILE',
    },

    // Admin - Users
    {
      name: 'VIEW_ADMIN_USERS',
      description: 'Access admin users page',
      category: 'ADMIN',
    },
    {
      name: 'CREATE_USER',
      description: 'Create new users',
      category: 'ADMIN',
    },
    {
      name: 'EDIT_USER',
      description: 'Edit user information',
      category: 'ADMIN',
    },
    {
      name: 'DELETE_USER',
      description: 'Delete users',
      category: 'ADMIN',
    },

    // Admin - Roles
    {
      name: 'VIEW_ADMIN_ROLES',
      description: 'Access admin roles page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_ROLES',
      description: 'Create, edit, and delete roles',
      category: 'ADMIN',
    },

    // Admin - Configuration
    {
      name: 'VIEW_ADMIN_CONFIG',
      description: 'Access admin configuration page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_CONFIG',
      description: 'Manage system configuration',
      category: 'ADMIN',
    },

    // Admin - Clients
    {
      name: 'VIEW_ADMIN_CLIENTS',
      description: 'Access admin clients page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_CLIENTS',
      description: 'Create, edit, and delete clients',
      category: 'ADMIN',
    },

    // Admin - Tasks
    {
      name: 'VIEW_ADMIN_TASKS',
      description: 'Access admin tasks page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_TASKS',
      description: 'Create, edit, and delete tasks',
      category: 'ADMIN',
    },

    // Admin - Leave Types
    {
      name: 'VIEW_ADMIN_LEAVE_TYPES',
      description: 'Access admin leave types page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_LEAVE_TYPES',
      description: 'Create, edit, and delete leave types',
      category: 'ADMIN',
    },

    // Admin - Branches
    {
      name: 'VIEW_ADMIN_BRANCHES',
      description: 'Access admin branches page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_BRANCHES',
      description: 'Create, edit, and delete branches',
      category: 'ADMIN',
    },

    // Admin - Positions
    {
      name: 'VIEW_ADMIN_POSITIONS',
      description: 'Access admin positions page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_POSITIONS',
      description: 'Create, edit, and delete positions',
      category: 'ADMIN',
    },

    // Admin - Capabilities
    {
      name: 'VIEW_ADMIN_CAPABILITIES',
      description: 'Access admin capabilities page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_CAPABILITIES',
      description: 'Create, edit, and delete capabilities',
      category: 'ADMIN',
    },

    // Admin - Capability Settings
    {
      name: 'VIEW_ADMIN_CAPABILITY_SETTINGS',
      description: 'Access admin capability settings page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_CAPABILITY_SETTINGS',
      description: 'Create, edit, and delete capability settings',
      category: 'ADMIN',
    },

    // Admin - Offday Settings
    {
      name: 'VIEW_ADMIN_OFFDAY_SETTINGS',
      description: 'Access admin offday settings page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_OFFDAY_SETTINGS',
      description: 'Create, edit, and delete offday settings',
      category: 'ADMIN',
    },

    // Admin - Overtime Settings
    {
      name: 'VIEW_ADMIN_OVERTIME_SETTINGS',
      description: 'Access admin overtime settings page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_OVERTIME_SETTINGS',
      description: 'Create, edit, and delete overtime settings',
      category: 'ADMIN',
    },

    // Admin - Audit Logs
    {
      name: 'VIEW_ADMIN_AUDIT_LOGS',
      description: 'Access admin audit logs page',
      category: 'ADMIN',
    },

    // Admin - Background Jobs
    {
      name: 'VIEW_ADMIN_BACKGROUND_JOBS',
      description: 'Access admin background jobs page',
      category: 'ADMIN',
    },
    {
      name: 'MANAGE_BACKGROUND_JOBS',
      description: 'Manage background jobs',
      category: 'ADMIN',
    },

    // Personal Timesheet
    {
      name: 'VIEW_PERSONAL_TIMESHEET',
      description: 'Access personal timesheet page',
      category: 'PERSONAL',
    },
    {
      name: 'EDIT_PERSONAL_TIMESHEET',
      description: 'Create and edit personal timesheet entries',
      category: 'PERSONAL',
    },
    {
      name: 'DELETE_PERSONAL_TIMESHEET',
      description: 'Delete personal timesheet entries',
      category: 'PERSONAL',
    },

    // Personal Requests
    {
      name: 'VIEW_PERSONAL_REQUESTS',
      description: 'Access personal off/remote/onsite requests page',
      category: 'PERSONAL',
    },
    {
      name: 'CREATE_REQUESTS',
      description: 'Create time-off, remote, and onsite requests',
      category: 'PERSONAL',
    },
    {
      name: 'EDIT_PERSONAL_REQUESTS',
      description: 'Edit own requests',
      category: 'PERSONAL',
    },
    {
      name: 'DELETE_PERSONAL_REQUESTS',
      description: 'Delete own requests',
      category: 'PERSONAL',
    },

    // Team Calendar
    {
      name: 'VIEW_TEAM_CALENDAR',
      description: 'Access team working calendar',
      category: 'PERSONAL',
    },

    // Personal Working Time
    {
      name: 'VIEW_PERSONAL_WORKING_TIME',
      description: 'Access personal working time page',
      category: 'PERSONAL',
    },
    {
      name: 'EDIT_PERSONAL_WORKING_TIME',
      description: 'Edit personal working time settings',
      category: 'PERSONAL',
    },

    // Management - Team Building
    {
      name: 'VIEW_MANAGEMENT_TEAM_BUILDING',
      description: 'Access management team building page',
      category: 'MANAGEMENT',
    },

    // Management - Reports
    {
      name: 'VIEW_MANAGEMENT_REPORTS',
      description: 'Access management reports page',
      category: 'MANAGEMENT',
    },

    // Management - Team Requests
    {
      name: 'VIEW_TEAM_REQUESTS',
      description: 'View team off/remote/onsite requests',
      category: 'MANAGEMENT',
    },
    {
      name: 'APPROVE_REQUESTS',
      description: 'Approve or reject team requests',
      category: 'MANAGEMENT',
    },
    {
      name: 'EDIT_TEAM_REQUESTS',
      description: 'Edit team requests',
      category: 'MANAGEMENT',
    },

    // Management - Timesheet Management
    {
      name: 'VIEW_TEAM_TIMESHEETS',
      description: 'Access timesheet management page',
      category: 'MANAGEMENT',
    },
    {
      name: 'APPROVE_TIMESHEETS',
      description: 'Approve or reject team timesheets',
      category: 'MANAGEMENT',
    },
    {
      name: 'EDIT_TEAM_TIMESHEETS',
      description: 'Edit team timesheet entries',
      category: 'MANAGEMENT',
    },

    // Management - Week Submissions
    {
      name: 'VIEW_WEEK_SUBMISSIONS',
      description: 'Access week submissions management page',
      category: 'MANAGEMENT',
    },
    {
      name: 'APPROVE_WEEK_SUBMISSIONS',
      description: 'Approve or reject week submissions',
      category: 'MANAGEMENT',
    },

    // Management - Timesheet Monitoring
    {
      name: 'VIEW_TIMESHEET_MONITORING',
      description: 'Access timesheet monitoring page',
      category: 'MANAGEMENT',
    },

    // Management - Project Management
    {
      name: 'VIEW_MANAGEMENT_PROJECTS',
      description: 'Access management projects page',
      category: 'MANAGEMENT',
    },
    {
      name: 'MANAGE_PROJECTS',
      description: 'Create, edit, and delete projects',
      category: 'MANAGEMENT',
    },

    // Management - Working Times
    {
      name: 'VIEW_TEAM_WORKING_TIMES',
      description: 'Access employee working times management page',
      category: 'MANAGEMENT',
    },
    {
      name: 'MANAGE_TEAM_WORKING_TIMES',
      description: 'Manage employee working time settings',
      category: 'MANAGEMENT',
    },

    // Management - Retrospective
    {
      name: 'VIEW_RETROSPECTIVE',
      description: 'Access retrospective page',
      category: 'MANAGEMENT',
    },

    // Management - Review Interns
    {
      name: 'VIEW_INTERN_REVIEWS',
      description: 'Access review interns page',
      category: 'MANAGEMENT',
    },
    {
      name: 'MANAGE_INTERN_REVIEWS',
      description: 'Create and manage intern reviews',
      category: 'MANAGEMENT',
    },

    // Management - Profile Changes
    {
      name: 'VIEW_PROFILE_CHANGES',
      description: 'Access profile changes management page',
      category: 'MANAGEMENT',
    },
    {
      name: 'APPROVE_PROFILE_CHANGES',
      description: 'Approve or reject profile change requests',
      category: 'MANAGEMENT',
    },
  ];

  const permissions: Record<string, any> = {};

  for (const permission of permissionData) {
    const result = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category,
      },
      create: permission,
    });
    permissions[permission.name.toLowerCase().replace(/_/g, '')] = result;
  }

  return permissions;
}

async function seedRolePermissions(
  roles: Record<string, any>,
  permissions: Record<string, any>,
) {
  // Clean up existing role permissions to avoid conflicts
  await prisma.rolePermission.deleteMany({});

  const rolePermissionMappings = [
    // ADMIN: Gets all permissions
    ...Object.values(permissions).map((permission) => ({
      role_id: roles.admin.id,
      permission_id: permission.id,
    })),

    // PM (Project Manager): Management and some admin capabilities
    { role_id: roles.pm.id, permission_id: permissions.viewdashboard.id },
    { role_id: roles.pm.id, permission_id: permissions.viewprofile.id },
    { role_id: roles.pm.id, permission_id: permissions.editprofile.id },

    // Personal features
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewpersonaltimesheet.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.editpersonaltimesheet.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.deletepersonaltimesheet.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewpersonalrequests.id,
    },
    { role_id: roles.pm.id, permission_id: permissions.createrequests.id },
    {
      role_id: roles.pm.id,
      permission_id: permissions.editpersonalrequests.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.deletepersonalrequests.id,
    },
    { role_id: roles.pm.id, permission_id: permissions.viewteamcalendar.id },
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewpersonalworkingtime.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.editpersonalworkingtime.id,
    },

    // Management features
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewmanagementteambuilding.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewmanagementreports.id,
    },
    { role_id: roles.pm.id, permission_id: permissions.viewteamrequests.id },
    { role_id: roles.pm.id, permission_id: permissions.approverequests.id },
    { role_id: roles.pm.id, permission_id: permissions.editteamrequests.id },
    { role_id: roles.pm.id, permission_id: permissions.viewteamtimesheets.id },
    { role_id: roles.pm.id, permission_id: permissions.approvetimesheets.id },
    { role_id: roles.pm.id, permission_id: permissions.editteamtimesheets.id },
    { role_id: roles.pm.id, permission_id: permissions.viewweeksubmissions.id },
    {
      role_id: roles.pm.id,
      permission_id: permissions.approveweeksubmissions.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewtimesheetmonitoring.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewmanagementprojects.id,
    },
    { role_id: roles.pm.id, permission_id: permissions.manageprojects.id },
    {
      role_id: roles.pm.id,
      permission_id: permissions.viewteamworkingtimes.id,
    },
    {
      role_id: roles.pm.id,
      permission_id: permissions.manageteamworkingtimes.id,
    },
    { role_id: roles.pm.id, permission_id: permissions.viewretrospective.id },
    { role_id: roles.pm.id, permission_id: permissions.viewinternreviews.id },
    { role_id: roles.pm.id, permission_id: permissions.manageinternreviews.id },

    // HR: User management and some admin features
    { role_id: roles.hr.id, permission_id: permissions.viewdashboard.id },
    { role_id: roles.hr.id, permission_id: permissions.viewprofile.id },
    { role_id: roles.hr.id, permission_id: permissions.editprofile.id },

    // Admin user management
    { role_id: roles.hr.id, permission_id: permissions.viewadminusers.id },
    { role_id: roles.hr.id, permission_id: permissions.createuser.id },
    { role_id: roles.hr.id, permission_id: permissions.edituser.id },
    { role_id: roles.hr.id, permission_id: permissions.viewadminbranches.id },
    { role_id: roles.hr.id, permission_id: permissions.managebranches.id },
    { role_id: roles.hr.id, permission_id: permissions.viewadminpositions.id },
    { role_id: roles.hr.id, permission_id: permissions.managepositions.id },

    // Personal features
    {
      role_id: roles.hr.id,
      permission_id: permissions.viewpersonaltimesheet.id,
    },
    {
      role_id: roles.hr.id,
      permission_id: permissions.editpersonaltimesheet.id,
    },
    {
      role_id: roles.hr.id,
      permission_id: permissions.deletepersonaltimesheet.id,
    },
    {
      role_id: roles.hr.id,
      permission_id: permissions.viewpersonalrequests.id,
    },
    { role_id: roles.hr.id, permission_id: permissions.createrequests.id },
    {
      role_id: roles.hr.id,
      permission_id: permissions.editpersonalrequests.id,
    },
    {
      role_id: roles.hr.id,
      permission_id: permissions.deletepersonalrequests.id,
    },
    { role_id: roles.hr.id, permission_id: permissions.viewteamcalendar.id },
    {
      role_id: roles.hr.id,
      permission_id: permissions.viewpersonalworkingtime.id,
    },
    {
      role_id: roles.hr.id,
      permission_id: permissions.editpersonalworkingtime.id,
    },

    // Management features
    {
      role_id: roles.hr.id,
      permission_id: permissions.viewmanagementreports.id,
    },
    { role_id: roles.hr.id, permission_id: permissions.viewteamrequests.id },
    { role_id: roles.hr.id, permission_id: permissions.approverequests.id },
    { role_id: roles.hr.id, permission_id: permissions.editteamrequests.id },
    { role_id: roles.hr.id, permission_id: permissions.viewteamtimesheets.id },
    { role_id: roles.hr.id, permission_id: permissions.viewweeksubmissions.id },
    {
      role_id: roles.hr.id,
      permission_id: permissions.viewteamworkingtimes.id,
    },
    {
      role_id: roles.hr.id,
      permission_id: permissions.manageteamworkingtimes.id,
    },
    { role_id: roles.hr.id, permission_id: permissions.viewprofilechanges.id },
    {
      role_id: roles.hr.id,
      permission_id: permissions.approveprofilechanges.id,
    },

    // USER: Basic user permissions
    { role_id: roles.user.id, permission_id: permissions.viewdashboard.id },
    { role_id: roles.user.id, permission_id: permissions.viewprofile.id },
    { role_id: roles.user.id, permission_id: permissions.editprofile.id },

    // Personal features only
    {
      role_id: roles.user.id,
      permission_id: permissions.viewpersonaltimesheet.id,
    },
    {
      role_id: roles.user.id,
      permission_id: permissions.editpersonaltimesheet.id,
    },
    {
      role_id: roles.user.id,
      permission_id: permissions.deletepersonaltimesheet.id,
    },
    {
      role_id: roles.user.id,
      permission_id: permissions.viewpersonalrequests.id,
    },
    { role_id: roles.user.id, permission_id: permissions.createrequests.id },
    {
      role_id: roles.user.id,
      permission_id: permissions.editpersonalrequests.id,
    },
    {
      role_id: roles.user.id,
      permission_id: permissions.deletepersonalrequests.id,
    },
    { role_id: roles.user.id, permission_id: permissions.viewteamcalendar.id },
    {
      role_id: roles.user.id,
      permission_id: permissions.viewpersonalworkingtime.id,
    },
    {
      role_id: roles.user.id,
      permission_id: permissions.editpersonalworkingtime.id,
    },
  ];

  for (const mapping of rolePermissionMappings) {
    await prisma.rolePermission.create({ data: mapping });
  }
}

async function seedBranches() {
  const branchData = [
    { branch_name: 'Hanoi', location: 'Hanoi, Vietnam' },
    { branch_name: 'Ho Chi Minh', location: 'Ho Chi Minh City, Vietnam' },
    { branch_name: 'Da Nang', location: 'Da Nang, Vietnam' },
  ];

  const branches: Record<string, any> = {};

  for (const branch of branchData) {
    const result = await prisma.branch.create({ data: branch });
    branches[branch.branch_name.toLowerCase().replace(/\s+/g, '')] = result;
  }

  return branches;
}

async function seedPositions() {
  const positionData = [
    { position_name: 'Developer', description: 'Software developer' },
    { position_name: 'Designer', description: 'UI/UX designer' },
    { position_name: 'Tester', description: 'Quality assurance engineer' },
    {
      position_name: 'Project Manager',
      description: 'Project management professional',
    },
    { position_name: 'HR Manager', description: 'Human resources manager' },
  ];

  const positions: Record<string, any> = {};

  for (const position of positionData) {
    const result = await prisma.position.upsert({
      where: { position_name: position.position_name },
      update: {},
      create: position,
    });
    positions[position.position_name.toLowerCase().replace(/\s+/g, '')] =
      result;
  }

  return positions;
}

async function seedCapabilities() {
  const capabilityData = [
    {
      capability_name: 'JavaScript',
      type: 'Point',
      note: 'JavaScript proficiency',
    },
    {
      capability_name: 'React',
      type: 'Point',
      note: 'React framework knowledge',
    },
    { capability_name: 'Node.js', type: 'Point', note: 'Node.js proficiency' },
    { capability_name: 'UI Design', type: 'Point', note: 'UI design skills' },
    { capability_name: 'UX Design', type: 'Point', note: 'UX design skills' },
    { capability_name: 'Testing', type: 'Point', note: 'QA testing skills' },
    {
      capability_name: 'Project Management',
      type: 'Point',
      note: 'Project management skills',
    },
  ];

  const capabilities: Record<string, any> = {};

  for (const capability of capabilityData) {
    const result = await prisma.capability.create({ data: capability });
    capabilities[
      capability.capability_name
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace('.', '')
    ] = result;
  }

  return capabilities;
}

async function seedCapabilitySettings(
  positions: Record<string, any>,
  capabilities: Record<string, any>,
) {
  const capabilitySettingsData = [
    {
      position_id: positions.developer.id,
      capability_id: capabilities.javascript.id,
      coefficient: 5,
    },
    {
      position_id: positions.developer.id,
      capability_id: capabilities.react.id,
      coefficient: 4,
    },
    {
      position_id: positions.developer.id,
      capability_id: capabilities.nodejs.id,
      coefficient: 4,
    },
    {
      position_id: positions.designer.id,
      capability_id: capabilities.uidesign.id,
      coefficient: 5,
    },
    {
      position_id: positions.designer.id,
      capability_id: capabilities.uxdesign.id,
      coefficient: 5,
    },
    {
      position_id: positions.tester.id,
      capability_id: capabilities.testing.id,
      coefficient: 5,
    },
    {
      position_id: positions.projectmanager.id,
      capability_id: capabilities.projectmanagement.id,
      coefficient: 5,
    },
  ];

  for (const setting of capabilitySettingsData) {
    await prisma.capabilitySetting.create({ data: setting });
  }
}

async function seedUsers(
  roles: Record<string, any>,
  branches: Record<string, any>,
  positions: Record<string, any>,
) {
  try {
    // Check if users already exist to avoid duplicate issues
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { email: 'jane.smith@example.com' },
          { email: 'robert.johnson@example.com' },
          { email: 'john.doe@example.com' },
          { email: 'michael.brown@example.com' },
          { email: 'sarah.davis@example.com' },
          { email: 'emily.williams@example.com' },
          { email: 'david.miller@example.com' },
          { email: 'inactive.user@example.com' },
          { email: 'senior.developer@example.com' },
        ],
      },
      select: { id: true, username: true, email: true },
    });

    console.log(
      `Found ${existingUsers.length} existing users, skipping duplicate creation.`,
    );

    if (existingUsers.length > 0) {
      // If users already exist, just return them to continue the seeding process
      return existingUsers;
    }

    // Generate password hash - use bcrypt if available, otherwise use plaintext for demo
    let passwordHash;
    try {
      // Try to hash the password with bcrypt
      passwordHash = await bcrypt.hash('Password123!', 10);
      console.log('Using bcrypt hashed password');
    } catch (error) {
      // Fallback to plaintext if bcrypt fails
      passwordHash = 'Password123!';
      console.log('Using plaintext password - bcrypt failed');
    }

    const users: any[] = [];

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: passwordHash,
        name: 'Admin',
        surname: 'User',
        email: 'admin@example.com',
        role_id: roles.admin.id,
        branch_id: branches.hanoi.id,
        position_id: positions.developer.id,
        start_date: new Date('2020-01-01'),
        allowed_leavedays: 15,
        employee_type: 'FULLTIME',
        level: 'SENIOR',
        address: 'Hanoi, Vietnam',
        phone: '0123456789',
        sex: 'MALE',
      },
    });
    users.push(admin);

    // Create HR user
    const hrUser = await prisma.user.create({
      data: {
        username: 'hrmanager',
        password: passwordHash,
        name: 'Jane',
        surname: 'Smith',
        email: 'jane.smith@example.com',
        role_id: roles.hr.id,
        branch_id: branches.hochiminh.id,
        position_id: positions.hrmanager.id,
        start_date: new Date('2021-02-20'),
        allowed_leavedays: 14,
        employee_type: 'FULLTIME',
        level: 'SENIOR',
        address: 'Ho Chi Minh City, Vietnam',
        phone: '0123456791',
        sex: 'FEMALE',
      },
    });
    users.push(hrUser);

    // Create PM user
    const pmUser = await prisma.user.create({
      data: {
        username: 'projectmanager',
        password: passwordHash,
        name: 'Robert',
        surname: 'Johnson',
        email: 'robert.johnson@example.com',
        role_id: roles.pm.id,
        branch_id: branches.danang.id,
        position_id: positions.projectmanager.id,
        start_date: new Date('2021-01-10'),
        allowed_leavedays: 13,
        employee_type: 'FULLTIME',
        level: 'SENIOR',
        address: 'Da Nang, Vietnam',
        phone: '0123456792',
        sex: 'MALE',
      },
    });
    users.push(pmUser);

    // Create regular users - changed from upsert to create
    const regularUserData = [
      {
        username: 'johndoe',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        branch_id: branches.hanoi.id,
        position_id: positions.developer.id,
        allowed_leavedays: 12,
        employee_type: 'FULLTIME',
        level: 'MIDDLE',
        phone: '0123456790',
      },
      {
        username: 'michaelbrown',
        name: 'Michael',
        surname: 'Brown',
        email: 'michael.brown@example.com',
        branch_id: branches.hochiminh.id,
        position_id: positions.tester.id,
        allowed_leavedays: 10,
        employee_type: 'FULLTIME',
        level: 'MIDDLE',
        phone: '0123456794',
      },
      {
        username: 'sarahdavis',
        name: 'Sarah',
        surname: 'Davis',
        email: 'sarah.davis@example.com',
        branch_id: branches.danang.id,
        position_id: positions.developer.id,
        allowed_leavedays: 10,
        employee_type: 'FULLTIME',
        level: 'JUNIOR',
        phone: '0123456795',
      },
      {
        username: 'emilywilliams',
        name: 'Emily',
        surname: 'Williams',
        email: 'emily.williams@example.com',
        branch_id: branches.hanoi.id,
        position_id: positions.designer.id,
        allowed_leavedays: 10,
        employee_type: 'FULLTIME',
        level: 'JUNIOR',
        phone: '0123456793',
      },
      {
        username: 'davidmiller',
        name: 'David',
        surname: 'Miller',
        email: 'david.miller@example.com',
        branch_id: branches.hanoi.id,
        position_id: positions.developer.id,
        allowed_leavedays: 10,
        employee_type: 'PARTTIME',
        level: 'MIDDLE',
        phone: '0123456796',
      },
    ];

    for (const userData of regularUserData) {
      try {
        const user = await prisma.user.create({
          data: {
            username: userData.username,
            password: passwordHash,
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            role_id: roles.user.id,
            branch_id: userData.branch_id,
            position_id: userData.position_id,
            start_date: new Date(
              2021,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1,
            ),
            allowed_leavedays: userData.allowed_leavedays,
            employee_type: userData.employee_type,
            level: userData.level,
            address: 'Vietnam',
            phone: userData.phone,
            sex: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
            trainer_id: pmUser.id,
          },
        });
        users.push(user);
      } catch (error) {
        console.warn(`Skipping user ${userData.username}: ${error.message}`);
      }
    }

    try {
      const inactiveUser = await prisma.user.create({
        data: {
          username: 'inactiveuser',
          password: passwordHash,
          name: 'Inactive',
          surname: 'User',
          email: 'inactive.user@example.com',
          role_id: roles.user.id,
          branch_id: branches.hanoi.id,
          position_id: positions.developer.id,
          start_date: new Date('2020-01-01'),
          stop_working_date: new Date('2023-12-31'),
          allowed_leavedays: 10,
          employee_type: 'FULLTIME',
          level: 'MIDDLE',
          address: 'Hanoi, Vietnam',
          phone: '0123456799',
          sex: 'MALE',
          is_active: false,
        },
      });
      users.push(inactiveUser);
    } catch (error) {
      console.warn(`Skipping inactive user: ${error.message}`);
    }

    try {
      const seniorUser = await prisma.user.create({
        data: {
          username: 'seniordeveloper',
          password: passwordHash,
          name: 'Senior',
          surname: 'Developer',
          email: 'senior.developer@example.com',
          role_id: roles.user.id,
          branch_id: branches.hanoi.id,
          position_id: positions.developer.id,
          start_date: new Date('2018-01-01'),
          allowed_leavedays: 15,
          employee_type: 'FULLTIME',
          level: 'SENIOR',
          address: 'Hanoi, Vietnam',
          phone: '0123456800',
          sex: 'MALE',
        },
      });
      users.push(seniorUser);

      // Only update if the users[5] exists
      if (users.length > 5) {
        await prisma.user.update({
          where: { id: users[5].id },
          data: { trainer_id: seniorUser.id },
        });
      }
    } catch (error) {
      console.warn(`Skipping senior developer: ${error.message}`);
    }

    return users;
  } catch (error) {
    console.error('Error creating users:', error);
    // Return empty array to continue with seeding process
    return [];
  }
}

async function seedWorkingTimes(users: any[]) {
  const defaultWorkingTime = {
    morning_start_at: new Date('2000-01-01T08:30:00'),
    morning_end_at: new Date('2000-01-01T12:00:00'),
    morning_hours: 3.5,
    afternoon_start_at: new Date('2000-01-01T13:00:00'),
    afternoon_end_at: new Date('2000-01-01T17:30:00'),
    afternoon_hours: 4.5,
    apply_date: new Date('2023-01-01'),
    is_current: true,
    status: 'APPROVED',
  };

  for (const user of users) {
    await prisma.workingTime.create({
      data: { ...defaultWorkingTime, user_id: user.id },
    });
  }

  const variations = [
    {
      user_id: users[3].id,
      morning_start_at: new Date('2000-01-01T09:00:00'),
      morning_end_at: new Date('2000-01-01T12:30:00'),
      morning_hours: 3.5,
      afternoon_start_at: new Date('2000-01-01T13:30:00'),
      afternoon_end_at: new Date('2000-01-01T18:00:00'),
      afternoon_hours: 4.5,
      apply_date: new Date('2023-06-01'),
      is_current: true,
      status: 'APPROVED',
    },
    {
      user_id: users[5].id,
      morning_start_at: new Date('2000-01-01T08:00:00'),
      morning_end_at: new Date('2000-01-01T12:00:00'),
      morning_hours: 4.0,
      afternoon_start_at: new Date('2000-01-01T13:00:00'),
      afternoon_end_at: new Date('2000-01-01T17:00:00'),
      afternoon_hours: 4.0,
      apply_date: new Date('2023-03-15'),
      is_current: true,
      status: 'APPROVED',
    },
  ];

  for (const variation of variations) {
    await prisma.workingTime.create({ data: variation });
  }
}

async function seedClients() {
  const clientData = [
    {
      client_name: 'Tech Solutions Inc.',
      contact_info: 'contact@techsolutions.com',
    },
    {
      client_name: 'Global Innovations',
      contact_info: 'info@globalinnovations.org',
    },
    {
      client_name: 'Digital Enterprises',
      contact_info: 'support@digitalenterprises.com',
    },
    {
      client_name: 'Creative Minds Ltd.',
      contact_info: 'hello@creativeminds.co',
    },
  ];

  const clients: Record<string, any> = {};

  for (const client of clientData) {
    const result = await prisma.client.create({ data: client });
    clients[client.client_name.toLowerCase().replace(/[^a-z0-9]/g, '')] =
      result;
  }

  return clients;
}

async function seedProjects(clients: Record<string, any>) {
  // Check for existing projects
  const existingProjects = await prisma.project.findMany({
    where: {
      project_code: {
        in: ['ECOM-2023', 'MBA-2023', 'HR-PORTAL', 'CRM-2023', 'WEB-2023'],
      },
    },
    select: { id: true, project_code: true, project_name: true },
  });

  console.log(
    `Found ${existingProjects.length} existing projects, skipping duplicate creation.`,
  );

  if (existingProjects.length > 0) {
    // Map existing projects by project code
    const projects: Record<string, any> = {};
    for (const project of existingProjects) {
      projects[project.project_code.toLowerCase()] = project;
    }
    return projects;
  }

  const projectData = [
    {
      project_name: 'E-commerce Platform',
      project_code: 'ECOM-2023',
      client_id: clients.techsolutionsinc?.id,
      start_date: new Date('2023-01-15'),
      end_date: new Date('2023-12-31'),
      note: 'Main e-commerce platform development',
      project_type: 'T&M',
      all_user: false,
      status: 'ACTIVE',
    },
    {
      project_name: 'Mobile Banking App',
      project_code: 'MBA-2023',
      client_id: clients.globalinnovations.id,
      start_date: new Date('2023-03-01'),
      end_date: new Date('2023-10-31'),
      note: 'Mobile banking application for iOS and Android',
      project_type: 'Fixed Price',
      all_user: false,
      status: 'ACTIVE',
    },
    {
      project_name: 'Internal HR Portal',
      project_code: 'HR-PORTAL',
      client_id: null,
      start_date: new Date('2023-02-01'),
      end_date: null,
      note: 'Internal HR portal for employee management',
      project_type: 'Non-Bill',
      all_user: true,
      status: 'ACTIVE',
    },
    {
      project_name: 'CRM System Enhancement',
      project_code: 'CRM-2023',
      client_id: clients.digitalenterprises.id,
      start_date: new Date('2023-05-01'),
      end_date: new Date('2023-11-30'),
      note: 'Enhancing existing CRM with new features',
      project_type: 'T&M',
      all_user: false,
      status: 'ACTIVE',
    },
    {
      project_name: 'Marketing Website Redesign',
      project_code: 'WEB-2023',
      client_id: clients.creativemindsltd.id,
      start_date: new Date('2023-06-01'),
      end_date: new Date('2023-08-31'),
      note: 'Complete redesign of marketing website',
      project_type: 'Fixed Price',
      all_user: false,
      status: 'ACTIVE',
    },
  ];

  const projects: Record<string, any> = {};

  for (const project of projectData) {
    try {
      const result = await prisma.project.create({ data: project });
      projects[project.project_code.toLowerCase()] = result;
    } catch (error) {
      console.warn(
        `Skipping project ${project.project_code}: ${error.message}`,
      );
    }
  }

  return projects;
}

async function seedUserProjects(users: any[], projects: Record<string, any>) {
  const userProjectMappings = [
    ...Object.values(projects).map((project) => ({
      user_id: users[0].id,
      project_id: project.id,
    })),
    { user_id: users[1].id, project_id: projects['hr-portal'].id },
    ...Object.values(projects).map((project) => ({
      user_id: users[2].id,
      project_id: project.id,
    })),
    { user_id: users[3].id, project_id: projects['ecom-2023'].id },
    { user_id: users[3].id, project_id: projects['mba-2023'].id },
    { user_id: users[4].id, project_id: projects['ecom-2023'].id },
    { user_id: users[4].id, project_id: projects['crm-2023'].id },
    { user_id: users[5].id, project_id: projects['mba-2023'].id },
    { user_id: users[6].id, project_id: projects['web-2023'].id },
    { user_id: users[7].id, project_id: projects['crm-2023'].id },
    { user_id: users[7].id, project_id: projects['ecom-2023'].id },
  ];

  for (const mapping of userProjectMappings) {
    await prisma.userProject.create({ data: mapping });
  }
}

async function seedTasks(projects: Record<string, any>) {
  // Check for existing tasks
  const existingTasks = await prisma.task.findMany({
    select: { id: true, project_id: true, task_name: true },
  });

  console.log(
    `Found ${existingTasks.length} existing tasks, skipping duplicate creation if needed.`,
  );

  if (existingTasks.length > 0) {
    const tasks: Record<string, any> = {};
    // Map existing tasks by project_id-taskname
    for (const task of existingTasks) {
      const key = `${task.project_id}-${task.task_name.toLowerCase().replace(/\s+/g, '')}`;
      tasks[key] = task;
    }

    // Check if we have all needed tasks already
    let hasAllTasks = true;
    for (const projectCode of Object.keys(projects)) {
      const project = projects[projectCode];
      const taskKey = `${project.id}-productcatalog`;
      if (!tasks[taskKey]) {
        hasAllTasks = false;
        break;
      }
    }

    if (hasAllTasks) {
      return tasks;
    }
  }

  const taskData = [
    {
      task_name: 'Product Catalog',
      project_id: projects['ecom-2023'].id,
      is_billable: true,
      description: 'Implement product catalog functionality',
    },
    {
      task_name: 'Shopping Cart',
      project_id: projects['ecom-2023'].id,
      is_billable: true,
      description: 'Implement shopping cart functionality',
    },
    {
      task_name: 'Payment Integration',
      project_id: projects['ecom-2023'].id,
      is_billable: true,
      description: 'Integrate payment gateways',
    },
    {
      task_name: 'User Authentication',
      project_id: projects['ecom-2023'].id,
      is_billable: true,
      description: 'Implement user authentication',
    },
    {
      task_name: 'Account Dashboard',
      project_id: projects['mba-2023'].id,
      is_billable: true,
      description: 'Implement account dashboard',
    },
    {
      task_name: 'Transaction History',
      project_id: projects['mba-2023'].id,
      is_billable: true,
      description: 'Implement transaction history feature',
    },
    {
      task_name: 'Fund Transfer',
      project_id: projects['mba-2023'].id,
      is_billable: true,
      description: 'Implement fund transfer functionality',
    },
    {
      task_name: 'Employee Profile',
      project_id: projects['hr-portal'].id,
      is_billable: false,
      description: 'Implement employee profile management',
    },
    {
      task_name: 'Leave Management',
      project_id: projects['hr-portal'].id,
      is_billable: false,
      description: 'Implement leave management system',
    },
    {
      task_name: 'Timesheet Module',
      project_id: projects['hr-portal'].id,
      is_billable: false,
      description: 'Implement timesheet tracking',
    },
    {
      task_name: 'Contact Management',
      project_id: projects['crm-2023'].id,
      is_billable: true,
      description: 'Enhance contact management features',
    },
    {
      task_name: 'Reporting Dashboard',
      project_id: projects['crm-2023'].id,
      is_billable: true,
      description: 'Implement advanced reporting dashboard',
    },
    {
      task_name: 'Email Integration',
      project_id: projects['crm-2023'].id,
      is_billable: true,
      description: 'Integrate email communication',
    },
    {
      task_name: 'Homepage Design',
      project_id: projects['web-2023'].id,
      is_billable: true,
      description: 'Design new homepage layout',
    },
    {
      task_name: 'Responsive Implementation',
      project_id: projects['web-2023'].id,
      is_billable: true,
      description: 'Implement responsive design across site',
    },
    {
      task_name: 'CMS Integration',
      project_id: projects['web-2023'].id,
      is_billable: true,
      description: 'Integrate with content management system',
    },
  ];

  const tasks: Record<string, any> = {};

  for (const task of taskData) {
    try {
      const result = await prisma.task.create({ data: task });
      const key = `${task.project_id}-${task.task_name.toLowerCase().replace(/\s+/g, '')}`;
      tasks[key] = result;
      console.log(`Created task: ${task.task_name}`);
    } catch (error) {
      console.warn(`Skipping task ${task.task_name}: ${error.message}`);

      // Try to find existing task
      const existingTask = await prisma.task.findFirst({
        where: {
          project_id: task.project_id,
          task_name: task.task_name,
        },
      });

      if (existingTask) {
        const key = `${task.project_id}-${task.task_name.toLowerCase().replace(/\s+/g, '')}`;
        tasks[key] = existingTask;
        console.log(`Using existing task: ${task.task_name}`);
      }
    }
  }

  return tasks;
}

async function seedAbsenceTypes() {
  const absenceTypeData = [
    {
      type_name: 'Annual Leave',
      description: 'Regular annual leave',
      deduct_from_allowed: true,
      available_days: null,
    },
    {
      type_name: 'Sick Leave',
      description: 'Medical leave with doctor note',
      deduct_from_allowed: true,
      available_days: null,
    },
    {
      type_name: 'Marriage Leave',
      description: 'Leave for marriage',
      deduct_from_allowed: false,
      available_days: 3,
    },
    {
      type_name: 'Bereavement Leave',
      description: 'Leave for family member passing',
      deduct_from_allowed: false,
      available_days: 3,
    },
    {
      type_name: 'Maternity Leave',
      description: 'Leave for childbirth and recovery',
      deduct_from_allowed: false,
      available_days: 180,
    },
    {
      type_name: 'Paternity Leave',
      description: 'Leave for new fathers',
      deduct_from_allowed: false,
      available_days: 14,
    },
    {
      type_name: 'Wife giving birth naturally',
      description: 'Leave for wife giving birth naturally',
      deduct_from_allowed: false,
      available_days: 5,
    },
    {
      type_name: 'Wife giving birth by C-section',
      description: 'Leave for wife giving birth by C-section',
      deduct_from_allowed: false,
      available_days: 7,
    },
  ];

  const absenceTypes: Record<string, any> = {};

  for (const absenceType of absenceTypeData) {
    const result = await prisma.absenceType.upsert({
      where: { type_name: absenceType.type_name },
      update: {},
      create: absenceType,
    });
    absenceTypes[absenceType.type_name.toLowerCase().replace(/[\s-]+/g, '')] =
      result;
  }

  return absenceTypes;
}

async function seedOffdaySettings() {
  const holidays = [
    { date: new Date('2023-01-01'), description: "New Year's Day" },
    { date: new Date('2023-01-02'), description: 'New Year Holiday' },
    { date: new Date('2023-01-21'), description: 'Lunar New Year Eve' },
    { date: new Date('2023-01-22'), description: 'Lunar New Year' },
    { date: new Date('2023-01-23'), description: 'Lunar New Year Holiday' },
    { date: new Date('2023-01-24'), description: 'Lunar New Year Holiday' },
    { date: new Date('2023-01-25'), description: 'Lunar New Year Holiday' },
    { date: new Date('2023-01-26'), description: 'Lunar New Year Holiday' },
    { date: new Date('2023-04-29'), description: 'Reunification Day' },
    { date: new Date('2023-05-01'), description: 'International Labor Day' },
    { date: new Date('2023-09-02'), description: 'National Day' },
    { date: new Date('2023-09-04'), description: 'National Day Holiday' },
  ];

  for (const holiday of holidays) {
    await prisma.offdaySetting.create({
      data: {
        offday_date: holiday.date,
        can_work_ot: true,
        ot_factor: 2.0,
        description: holiday.description,
      },
    });
  }
}

async function seedProjectOtSettings(projects: Record<string, any>) {
  const otSettings = [
    {
      project_id: projects['ecom-2023'].id,
      date_at: new Date('2023-08-15'),
      ot_factor: 1.5,
      note: 'Critical release preparation',
    },
    {
      project_id: projects['mba-2023'].id,
      date_at: new Date('2023-09-15'),
      ot_factor: 1.5,
      note: 'Final testing before UAT',
    },
    {
      project_id: projects['crm-2023'].id,
      date_at: new Date('2023-10-20'),
      ot_factor: 1.5,
      note: 'Deployment preparation',
    },
  ];

  for (const setting of otSettings) {
    await prisma.projectOtSetting.create({ data: setting });
  }
}

async function seedTimesheets(
  users: any[],
  projects: Record<string, any>,
  tasks: Record<string, any>,
) {
  const timesheets: any[] = [];

  for (const user of users) {
    const userProjects = await prisma.userProject.findMany({
      where: { user_id: user.id },
      include: { project: true },
    });

    if (userProjects.length === 0) continue;

    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const userProject of userProjects) {
        const projectTasks = await prisma.task.findMany({
          where: { project_id: userProject.project_id },
          take: 1,
        });

        if (projectTasks.length === 0) continue;

        const workingHours = Math.floor(Math.random() * 6) + 2;

        // Fix: Safe date creation with validation
        const hour8 = 8 + Math.floor(Math.random() * 2);
        const minute8 = Math.floor(Math.random() * 60);
        const hour17 = 17 + Math.floor(Math.random() * 2);
        const minute17 = Math.floor(Math.random() * 60);

        // Ensure valid time values
        const actualCheckInTime = new Date(
          `2000-01-01T${hour8.toString().padStart(2, '0')}:${minute8.toString().padStart(2, '0')}:00`,
        );
        const actualCheckOutTime = new Date(
          `2000-01-01T${hour17.toString().padStart(2, '0')}:${minute17.toString().padStart(2, '0')}:00`,
        );

        // Double-check dates are valid
        if (
          isNaN(actualCheckInTime.getTime()) ||
          isNaN(actualCheckOutTime.getTime())
        ) {
          console.warn('Skipping timesheet due to invalid date calculation');
          continue;
        }

        // Ensure check-out is after check-in
        if (actualCheckOutTime <= actualCheckInTime) {
          // Adjust check-out time to be at least 4 hours after check-in
          actualCheckOutTime.setTime(
            actualCheckInTime.getTime() + 4 * 60 * 60 * 1000,
          );
        }

        try {
          // Calculate late/early minutes properly
          const checkInLate = Math.max(0, hour8 * 60 + minute8 - (8 * 60 + 30));

          const checkOutEarly = Math.max(
            0,
            17 * 60 + 30 - (hour17 * 60 + minute17),
          );

          const timesheet = await prisma.timesheet.create({
            data: {
              user_id: user.id,
              project_id: userProject.project_id,
              task_id: projectTasks[0].id,
              date,
              working_time: workingHours,
              type: 'NORMAL',
              note: `Work on ${projectTasks[0].task_name}`,
              status: ['PENDING', 'APPROVED', 'APPROVED', 'APPROVED'][
                Math.floor(Math.random() * 4)
              ],
              check_in: new Date('2000-01-01T08:30:00'),
              check_out: new Date('2000-01-01T17:30:00'),
              actual_check_in: actualCheckInTime,
              actual_check_out: actualCheckOutTime,
              check_in_late: checkInLate,
              check_out_early: checkOutEarly,
              edited_by_id: Math.random() > 0.8 ? users[0].id : null,
              money: 0,
              punishment: null,
            },
          });

          if (checkInLate > 15 || checkOutEarly > 15) {
            await prisma.timesheet.update({
              where: { id: timesheet.id },
              data: {
                money: 50000,
                punishment: 'Late check-in or early check-out',
              },
            });
          }

          timesheets.push(timesheet);
        } catch (error) {
          console.warn(`Error creating timesheet: ${error.message}`);
        }
      }
    }
  }

  // Add special timesheets
  try {
    const holidayTimesheet = await prisma.timesheet.create({
      data: {
        user_id: users[3]?.id,
        project_id: projects['ecom-2023']?.id,
        task_id: tasks[`${projects['ecom-2023']?.id}-productcatalog`]?.id,
        date: new Date('2023-01-01'),
        working_time: 4,
        type: 'HOLIDAY',
        note: 'Work on Product Catalog during holiday',
        status: 'PENDING',
        check_in: new Date('2000-01-01T09:00:00'),
        check_out: new Date('2000-01-01T13:00:00'),
        actual_check_in: new Date('2000-01-01T09:00:00'),
        actual_check_out: new Date('2000-01-01T13:00:00'),
        check_in_late: 0,
        check_out_early: 0,
      },
    });
    timesheets.push(holidayTimesheet);
  } catch (error) {
    console.warn(`Error creating holiday timesheet: ${error.message}`);
  }

  try {
    const otTimesheet = await prisma.timesheet.create({
      data: {
        user_id: users[3]?.id,
        project_id: projects['ecom-2023']?.id,
        task_id: tasks[`${projects['ecom-2023']?.id}-productcatalog`]?.id,
        date: new Date('2023-08-15'),
        working_time: 3,
        type: 'OVERTIME',
        note: 'Overtime work for critical release',
        status: 'APPROVED',
        check_in: new Date('2000-01-01T18:00:00'),
        check_out: new Date('2000-01-01T21:00:00'),
        actual_check_in: new Date('2000-01-01T18:00:00'),
        actual_check_out: new Date('2000-01-01T21:00:00'),
        check_in_late: 0,
        check_out_early: 0,
      },
    });
    timesheets.push(otTimesheet);
  } catch (error) {
    console.warn(`Error creating overtime timesheet: ${error.message}`);
  }

  try {
    const pastTimesheet = await prisma.timesheet.create({
      data: {
        user_id: users[3]?.id,
        project_id: projects['ecom-2023']?.id,
        task_id: tasks[`${projects['ecom-2023']?.id}-productcatalog`]?.id,
        date: new Date('2022-06-15'),
        working_time: 8,
        type: 'NORMAL',
        note: 'Work on Product Catalog in 2022',
        status: 'APPROVED',
        check_in: new Date('2000-01-01T08:30:00'),
        check_out: new Date('2000-01-01T17:30:00'),
        actual_check_in: new Date('2000-01-01T08:30:00'),
        actual_check_out: new Date('2000-01-01T17:30:00'),
        check_in_late: 0,
        check_out_early: 0,
      },
    });
    timesheets.push(pastTimesheet);
  } catch (error) {
    console.warn(`Error creating past timesheet: ${error.message}`);
  }

  return timesheets;
}

async function seedTimesheetComplaints(timesheets: any[]) {
  for (const timesheet of timesheets) {
    if (Math.random() > 0.1) continue;

    await prisma.timesheetComplaint.create({
      data: {
        timesheet_id: timesheet.id,
        complain:
          'The working hours do not reflect the actual time I worked on this task.',
        complain_reply:
          Math.random() > 0.5
            ? 'We will review your timesheet and make necessary adjustments.'
            : null,
      },
    });
  }
}

async function seedRequests(
  users: any[],
  projects: Record<string, any>,
  absenceTypes: Record<string, any>,
) {
  const requestTypes = ['OFF', 'REMOTE', 'ONSITE'];
  const periods = ['MORNING', 'AFTERNOON', 'FULL_DAY'];
  const requests: any[] = [];

  for (const user of users) {
    const numRequests = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numRequests; i++) {
      const requestType =
        requestTypes[Math.floor(Math.random() * requestTypes.length)];
      let absence_type_id: string | null = null;
      let project_id: string | null | undefined = null;

      if (requestType === 'OFF') {
        const absenceTypeKeys = Object.keys(absenceTypes);
        absence_type_id =
          absenceTypes[
            absenceTypeKeys[Math.floor(Math.random() * absenceTypeKeys.length)]
          ].id;
      } else {
        const userProjects = await prisma.userProject.findMany({
          where: { user_id: user.id },
        });
        if (userProjects.length > 0) {
          project_id =
            userProjects[Math.floor(Math.random() * userProjects.length)]
              .project_id;
        } else {
          continue;
        }
      }

      const startDate = new Date();
      startDate.setDate(
        startDate.getDate() + Math.floor(Math.random() * 30) + 1,
      );
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3));
      const startPeriod = periods[Math.floor(Math.random() * periods.length)];
      const endPeriod = periods[Math.floor(Math.random() * periods.length)];
      const statusRoll = Math.random();
      let status: string = 'PENDING';
      let modified_by_id: string | null = null;
      let modified_at: Date | null = null;

      if (statusRoll < 0.6) {
        status = 'APPROVED';
        modified_by_id = users[0].id;
        modified_at = new Date();
      } else if (statusRoll >= 0.9) {
        status = 'REJECTED';
        modified_by_id = users[0].id;
        modified_at = new Date();
      }

      const request = await prisma.request.create({
        data: {
          user_id: user.id,
          project_id,
          request_type: requestType,
          absence_type_id,
          start_date: startDate,
          start_period: startPeriod,
          end_date: endDate,
          end_period: endPeriod,
          status,
          note: `${requestType} request from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          modified_by_id,
          modified_at,
        },
      });
      requests.push(request);
    }
  }

  const overlappingRequest = await prisma.request.create({
    data: {
      user_id: users[3].id,
      project_id: projects['ecom-2023'].id,
      request_type: 'OFF',
      absence_type_id: absenceTypes.annualleave.id,
      start_date: new Date('2023-10-01'),
      start_period: 'FULL_DAY',
      end_date: new Date('2023-10-03'),
      end_period: 'FULL_DAY',
      status: 'APPROVED',
      note: 'Annual leave request',
      modified_by_id: users[0].id,
      modified_at: new Date(),
    },
  });
  requests.push(overlappingRequest);

  const overlappingRequest2 = await prisma.request.create({
    data: {
      user_id: users[3].id,
      project_id: projects['ecom-2023'].id,
      request_type: 'OFF',
      absence_type_id: absenceTypes.sickleave.id,
      start_date: new Date('2023-10-02'),
      start_period: 'FULL_DAY',
      end_date: new Date('2023-10-04'),
      end_period: 'FULL_DAY',
      status: 'PENDING',
      note: 'Sick leave request',
    },
  });
  requests.push(overlappingRequest2);

  return requests;
}

async function seedAuditLogs(users: any[], requests: any[], timesheets: any[]) {
  for (const request of requests) {
    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      await prisma.auditLog.create({
        data: {
          table_name: 'requests',
          record_id: request.id,
          action: request.status,
          modified_by_id: request.modified_by_id || users[0].id,
          details: {
            old_status: 'PENDING',
            new_status: request.status,
            request_type: request.request_type,
            start_date: request.start_date.toISOString().split('T')[0],
            end_date: request.end_date.toISOString().split('T')[0],
          },
        },
      });
    }
  }

  for (const timesheet of timesheets) {
    if (timesheet.edited_by_id) {
      await prisma.auditLog.create({
        data: {
          table_name: 'timesheets',
          record_id: timesheet.id,
          action: 'UPDATE',
          modified_by_id: timesheet.edited_by_id,
          details: {
            date: timesheet.date.toISOString().split('T')[0],
            working_time: timesheet.working_time.toString(),
            status: timesheet.status,
          },
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error('Error in seeding operation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
