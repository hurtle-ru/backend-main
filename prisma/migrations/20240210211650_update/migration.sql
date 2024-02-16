/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "OrderStatus";
