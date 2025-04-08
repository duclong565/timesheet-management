/*
  Warnings:

  - The primary key for the `absence_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `branches` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `capabilities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `capability_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `offday_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `positions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_ot_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `timesheet_complaints` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `timesheets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users_project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `working_times` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "capability_settings" DROP CONSTRAINT "capability_settings_capability_id_fkey";

-- DropForeignKey
ALTER TABLE "capability_settings" DROP CONSTRAINT "capability_settings_position_id_fkey";

-- DropForeignKey
ALTER TABLE "project_ot_settings" DROP CONSTRAINT "project_ot_settings_project_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_client_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_absence_type_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_project_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_user_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_fkey";

-- DropForeignKey
ALTER TABLE "timesheet_complaints" DROP CONSTRAINT "timesheet_complaints_timesheet_id_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_edited_by_id_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_project_id_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_task_id_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_position_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_trainer_id_fkey";

-- DropForeignKey
ALTER TABLE "users_project" DROP CONSTRAINT "users_project_project_id_fkey";

-- DropForeignKey
ALTER TABLE "users_project" DROP CONSTRAINT "users_project_user_id_fkey";

-- DropForeignKey
ALTER TABLE "working_times" DROP CONSTRAINT "working_times_user_id_fkey";

-- AlterTable
ALTER TABLE "absence_types" DROP CONSTRAINT "absence_types_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "absence_types_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "absence_types_id_seq";

-- AlterTable
ALTER TABLE "branches" DROP CONSTRAINT "branches_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "branches_id_seq";

-- AlterTable
ALTER TABLE "capabilities" DROP CONSTRAINT "capabilities_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "capabilities_id_seq";

-- AlterTable
ALTER TABLE "capability_settings" DROP CONSTRAINT "capability_settings_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "position_id" SET DATA TYPE TEXT,
ALTER COLUMN "capability_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "capability_settings_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "capability_settings_id_seq";

-- AlterTable
ALTER TABLE "clients" DROP CONSTRAINT "clients_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "clients_id_seq";

-- AlterTable
ALTER TABLE "offday_settings" DROP CONSTRAINT "offday_settings_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "offday_settings_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "offday_settings_id_seq";

-- AlterTable
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "permissions_id_seq";

-- AlterTable
ALTER TABLE "positions" DROP CONSTRAINT "positions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "positions_id_seq";

-- AlterTable
ALTER TABLE "project_ot_settings" DROP CONSTRAINT "project_ot_settings_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "project_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "project_ot_settings_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "project_ot_settings_id_seq";

-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "client_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "projects_id_seq";

-- AlterTable
ALTER TABLE "requests" DROP CONSTRAINT "requests_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "project_id" SET DATA TYPE TEXT,
ALTER COLUMN "absence_type_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "requests_id_seq";

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ALTER COLUMN "permission_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "role_permissions_id_seq";

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "roles_id_seq";

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "project_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "tasks_id_seq";

-- AlterTable
ALTER TABLE "timesheet_complaints" DROP CONSTRAINT "timesheet_complaints_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "timesheet_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "timesheet_complaints_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "timesheet_complaints_id_seq";

-- AlterTable
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "project_id" SET DATA TYPE TEXT,
ALTER COLUMN "task_id" SET DATA TYPE TEXT,
ALTER COLUMN "edited_by_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "timesheets_id_seq";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ALTER COLUMN "branch_id" SET DATA TYPE TEXT,
ALTER COLUMN "position_id" SET DATA TYPE TEXT,
ALTER COLUMN "trainer_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "users_id_seq";

-- AlterTable
ALTER TABLE "users_project" DROP CONSTRAINT "users_project_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "project_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_project_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "users_project_id_seq";

-- AlterTable
ALTER TABLE "working_times" DROP CONSTRAINT "working_times_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "working_times_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "working_times_id_seq";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_times" ADD CONSTRAINT "working_times_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_project" ADD CONSTRAINT "users_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_project" ADD CONSTRAINT "users_project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capability_settings" ADD CONSTRAINT "capability_settings_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capability_settings" ADD CONSTRAINT "capability_settings_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_ot_settings" ADD CONSTRAINT "project_ot_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_complaints" ADD CONSTRAINT "timesheet_complaints_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_absence_type_id_fkey" FOREIGN KEY ("absence_type_id") REFERENCES "absence_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
