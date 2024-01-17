import { Prisma } from '@prisma/client'
import { prisma } from '../../infrastructure/database/prismaClient';
import { HttpError } from '../../infrastructure/error/httpError';


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
        const employer = await prisma.employer.findUnique(
          {
            where: {id},
            include: {
              password: true,
              meetings: true,
              vacancies: true,
            },
          })

        if (!employer) throw new HttpError(404, "Employer not found");

        await prisma.$transaction([
          prisma.password.deleteMany({where: {employer: { id: employer.id} } } ),

          prisma.meetingFeedback.deleteMany( { where: { meeting: { employerId: id } } }),
          prisma.meetingScriptAnswer.deleteMany( { where: { protocol: { meeting: { employerId: employer.id } } } } ),
          prisma.meetingScriptProtocol.deleteMany( { where: { meeting: { employerId: employer.id} } } ),
          prisma.meeting.deleteMany( { where: { employerId: id} } ),

          prisma.offer.deleteMany( { where: { vacancy: {employerId: employer.id} } } ),
          prisma.vacancy.deleteMany( {where: { employerId: id} } ),

          prisma.employer.delete({ where: { id } } ),
        ]);

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
