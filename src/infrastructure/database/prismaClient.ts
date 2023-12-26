import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient().$extends({
  result: {
    applicant: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
    employer: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
    manager: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
  },
});