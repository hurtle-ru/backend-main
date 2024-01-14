import { Prisma } from '@prisma/client'
import { prisma } from '../../infrastructure/database/prismaClient';


export const applicantPrismaExtension = Prisma.defineExtension({
  result: {
    applicant: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
  },
  model: {
    applicant: {
      async archive(id: string) {
        return {"test": "testing"}
      },
    },
  },
})