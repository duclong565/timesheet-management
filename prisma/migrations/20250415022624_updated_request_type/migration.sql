/*
  Warnings:

  - Added the required column `available_days` to the `absence_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "absence_types" ADD COLUMN     "available_days" INTEGER NOT NULL,
ADD COLUMN     "deduct_from_allowed" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "allowed_leavedays" SET DEFAULT 12;
