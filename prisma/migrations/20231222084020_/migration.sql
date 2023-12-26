/*
  Warnings:

  - You are about to drop the column `conferenceLink` on the `Meeting` table. All the data in the column will be lost.
  - Added the required column `roomUrl` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "conferenceLink",
ADD COLUMN     "roomUrl" TEXT NOT NULL;
