import { Applicant, Prisma, } from "@prisma/client";
import { prisma, } from "../../infrastructure/database/prisma.provider";
import { HttpError, } from "../../infrastructure/error/http.error";


type ApplicantCreateExtendedArgs = {
  create_empty_resume: boolean;
}


export const applicantPrismaExtension = Prisma.defineExtension({
  model: {
    applicant: {
      async archive(id: string,) {
        const context = Prisma.getExtensionContext(this,);
        const applicant = await prisma.applicant.findUnique({
          where: { id, },
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
            aiChats: {
              include: {
                history: true,
              },
            },
          },
        },);

        if (!applicant) throw new HttpError(404, "Applicant not found",);

        await prisma.applicant.delete({ where: { id, }, },);
        await prisma.softArchive.create({
          data: {
            modelName: context.$name,
            originalId: applicant.id,
            payload: applicant,
          },
        },);
      },
      async extendedCreate(
        args: Prisma.ApplicantCreateArgs,
        extended_params: ApplicantCreateExtendedArgs = {
          create_empty_resume: false,
        },
      ): Promise<Applicant> {
        const data: Prisma.ApplicantCreateInput = { ...args.data, };

        if (extended_params.create_empty_resume) {
          data.resume = data.resume || {
            create: {}, // TODO create 'createEmpty' resume method if need
          };
        }

        return await prisma.applicant.create({
          include: args.include,
          select: args.select,
          data,
        },);
      },
    },
  },
},);
