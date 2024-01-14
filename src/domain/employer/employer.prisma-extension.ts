import { Prisma } from '@prisma/client'


export const employerPrismaExtension = Prisma.defineExtension({
  result: {
    employer: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
  },
  model: {
    employer: {
      async archive(id: string) {
        return {"test": "testing"}
      },
    },
  },
})