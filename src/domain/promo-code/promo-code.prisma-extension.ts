import { Prisma, PromoCode } from "@prisma/client";


export const promoCodePrismaExtension = Prisma.defineExtension({
  model: {
    promoCode: {
      isAvailable({ isActive, expirationDate, successfulUses, maxUses }: PromoCode) {
        return isActive
          && (expirationDate == null || expirationDate > new Date())
          && (maxUses == null || maxUses > successfulUses);
      },
    },
  },
});