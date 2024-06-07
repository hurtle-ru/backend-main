-- AlterTable
ALTER TABLE "MeetingPayment" ADD COLUMN     "appliedPromoCodeValue" TEXT;

-- CreateTable
CREATE TABLE "PromoCode" (
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discount" INTEGER NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL,
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("value")
);

-- AddForeignKey
ALTER TABLE "MeetingPayment" ADD CONSTRAINT "MeetingPayment_appliedPromoCodeValue_fkey" FOREIGN KEY ("appliedPromoCodeValue") REFERENCES "PromoCode"("value") ON DELETE SET NULL ON UPDATE CASCADE;
