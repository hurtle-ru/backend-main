/*
  Warnings:

  - You are about to drop the column `accessLevels` on the `Manager` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ManagerAccessScopes" AS ENUM ('NONE');

-- AlterTable
ALTER TABLE "Manager" DROP COLUMN "accessLevels",
ADD COLUMN     "accessScopes" "ManagerAccessScopes"[];

-- DropEnum
DROP TYPE "ManagerAccessLevel";
