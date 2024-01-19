import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError } from "../../infrastructure/error/httpError";


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
        const context = Prisma.getExtensionContext(this);
        const applicant = await prisma.applicant.findUnique({
          where: { id },
          include: {
            hhToken: true,
            password: true,
            resume: {
              include: {
                certificates: true,
                contacts: true,
                education: true,
                experience: true,
                languages: true,
              },
            },
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
            offers: true,
            assignedVacancies: true,
          },
        });

        if (!applicant) throw new HttpError(404, "Applicant not found");

        await prisma.applicant.delete({ where: { id } });
        await prisma.softArchive.create({
          data: {
            modelName: context.$name,
            originalId: applicant.id,
            payload: applicant,
          },
        });
      },
    },
  },
});
