/*
  Warnings:

  - The primary key for the `University` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `University` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "University" DROP CONSTRAINT "University_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "University_pkey" PRIMARY KEY ("id");
