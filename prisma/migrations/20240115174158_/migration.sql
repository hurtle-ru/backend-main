/*
  Warnings:

  - You are about to drop the `SoftArchieve` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "SoftArchieve";

-- CreateTable
CREATE TABLE "SoftArchive" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "SoftArchive_pkey" PRIMARY KEY ("id")
);
