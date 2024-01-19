/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `University` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "University_name_key" ON "University"("name");
