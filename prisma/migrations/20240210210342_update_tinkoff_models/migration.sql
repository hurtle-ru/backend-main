/*
  Warnings:

  - Added the required column `token` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "token" VARCHAR(64) NOT NULL;
