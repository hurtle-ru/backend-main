-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CANCELED', 'PREAUTHORIZING', 'FORMSHOWED');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "temporaryEmail" VARCHAR(255);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(255) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "slotId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_slotId_key" ON "Order"("slotId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
