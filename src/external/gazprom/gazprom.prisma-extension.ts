import { GazpromToken, Prisma } from "@prisma/client";


export const GazpromTokenExtension = Prisma.defineExtension({
  model: {
    gazpromToken: {
      isExpired({ createdAt, expiresIn }: GazpromToken) {
        return Date.now() - createdAt.getTime() > expiresIn * 1000;
      },
    },
  },
});
