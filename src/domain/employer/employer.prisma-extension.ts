import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError } from "../../infrastructure/error/httpError";


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
        const context = Prisma.getExtensionContext(this);
        const employer = await prisma.employer.findUnique({
          where: { id },
          include: {
            password: true,
            meetings: {
              include: {
                feedback: true,
                scriptProtocols: {
                  include: {
                    answers: true,
                  },
                },
              },
            },
            vacancies: {
              include: {
                offers: true,
              },
            },
          },
        });

        if (!employer) throw new HttpError(404, "Employer not found");

        await prisma.employer.delete({ where: { id } } );
        await prisma.softArchive.create({
          data: {
            modelName: context.name,
            originalId: employer.id,
            payload: employer,
          },
        });
      },
    },
  },
})
