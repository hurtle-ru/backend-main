/*
  Warnings:

  - A unique constraint covering the columns `[hhApplicantId]` on the table `HhToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HhToken_hhApplicantId_key" ON "HhToken"("hhApplicantId");
