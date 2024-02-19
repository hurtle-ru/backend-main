import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError } from "../../infrastructure/error/http.error";


export const applicantPrismaExtension = Prisma.defineExtension({
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
                slot: {
                  include: {
                    payments: true,
                  },
                },
              },
            },
            vacancyResponses: {
              include: {
                offer: true,
              },
            },
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
