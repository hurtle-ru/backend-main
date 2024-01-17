import { Prisma } from '@prisma/client'
import { prisma } from '../../infrastructure/database/prismaClient';
import { HttpError } from '../../infrastructure/error/httpError';


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
        const applicant = await (context as any).applicant.findUnique(
          {
            where: {id},
            include: {
              hhToken: true,
              password: true,
              resume: true,
              meetings: true,
              offers: true,
              assignedVacancies: true,
            },
          })

        if (!applicant) throw new HttpError(404, "Applicant not found");

        await (context as any).softArchive.create({
          data: {
            modelName: context.name,
            originalId: applicant.id,
            payload: applicant,
          },
        })

        await (context as any).$transaction([
          (context as any).hhToken.delete( { where: { applicantId: id } } ),
          (context as any).password.deleteMany( { where: { applicant: { id: applicant.id}} } ),

          (context as any).resumeCertificate.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          (context as any).resumeContact.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          (context as any).resumeEducation.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          (context as any).resumeExperience.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          (context as any).resumeLanguage.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          (context as any).resume.delete( { where: { applicantId: id } } ),

          (context as any).meetingFeedback.deleteMany( {  where: {  meeting: { applicantId: id } } } ),
          (context as any).meetingScriptAnswer.deleteMany( { where: { protocol: {meeting: {applicantId: applicant.id } } } } ),
          (context as any).meetingScriptProtocol.deleteMany( { where: { meeting: {applicantId: applicant.id} } } ),

          (context as any).meeting.deleteMany( { where: { applicantId: id} } ),

          (context as any).offer.deleteMany( { where: { candidateId: id} } ),
          (context as any).applicant.delete( { where: { id } } ),
        ])
      },
    },
  },
})