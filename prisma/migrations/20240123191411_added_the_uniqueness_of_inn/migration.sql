/*
  Warnings:

  - A unique constraint covering the columns `[inn]` on the table `Employer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Employer_inn_key" ON "Employer"("inn");
