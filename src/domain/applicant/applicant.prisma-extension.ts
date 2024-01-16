import { Prisma } from "@prisma/client";
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
        const applicant = await prisma.applicant.findUnique(
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

        await prisma.softArchive.create({
          data: {
            modelName: context.name,
            originalId: applicant.id,
            payload: applicant,
          },
        })

        await prisma.$transaction([
          prisma.hhToken.delete( { where: { applicantId: id } } ),
          prisma.password.deleteMany( { where: { applicant: { id: applicant.id}} } ),

          prisma.resumeCertificate.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          prisma.resumeContact.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          prisma.resumeEducation.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          prisma.resumeExperience.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          prisma.resumeLanguage.deleteMany( { where: { resumeId: applicant.resume?.id } } ),
          prisma.resume.delete( { where: { applicantId: id } } ),

          prisma.meetingFeedback.deleteMany( {  where: {  meeting: { applicantId: id } } } ),
          prisma.meetingScriptAnswer.deleteMany( { where: { protocol: {meeting: {applicantId: applicant.id } } } } ),
          prisma.meetingScriptProtocol.deleteMany( { where: { meeting: {applicantId: applicant.id} } } ),
          prisma.meeting.deleteMany( { where: { applicantId: id} } ),

          prisma.offer.deleteMany( { where: { candidateId: id} } ),

          prisma.applicant.delete( { where: { id } } ),
        ])
      },
    },
  },
})
