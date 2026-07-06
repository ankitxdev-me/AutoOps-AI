/*
  Warnings:

  - The `role` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `BusinessProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BusinessSettings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `country` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `industry` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "BusinessProfile" DROP CONSTRAINT "BusinessProfile_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessSettings" DROP CONSTRAINT "BusinessSettings_tenantId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "role",
ADD COLUMN     "role" "EmployeeRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "industry" TEXT NOT NULL,
ALTER COLUMN "onboardingStep" SET DEFAULT '1';

-- DropTable
DROP TABLE "BusinessProfile";

-- DropTable
DROP TABLE "BusinessSettings";

-- CreateTable
CREATE TABLE "SchemaVerification" (
    "id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaVerification_pkey" PRIMARY KEY ("id")
);
