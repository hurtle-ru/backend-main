import { Prisma } from "@prisma/client";


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
})