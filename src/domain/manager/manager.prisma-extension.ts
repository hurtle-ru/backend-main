import { Prisma } from '@prisma/client'


export const managerPrismaExtension = Prisma.defineExtension({
  result: {
    manager: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
  },
})