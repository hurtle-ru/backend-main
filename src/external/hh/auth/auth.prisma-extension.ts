import { HhToken, Prisma } from "@prisma/client";


export const hhTokenExtension = Prisma.defineExtension({
  model: {
    hhToken: {
      isExpired({ createdAt, expiresIn}: HhToken) {
        return Date.now() - createdAt.getTime() > expiresIn * 1000;
      },
    },
  },
})