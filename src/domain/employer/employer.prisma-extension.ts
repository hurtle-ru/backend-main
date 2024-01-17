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
        const employer = await (context as any).employer.findUnique(
          {
            where: {id},
            include: {
              password: true,
              meetings: true,
              vacancies: true,
            },
          })

        if (!employer) throw new HttpError(404, "Employer not found");

        await (context as any).softArchive.create({
          data: {
            modelName: context.name,
            originalId: employer.id,
            payload: employer,
          },
        })

        await (context as any).$transaction([
          (context as any).password.deleteMany({where: {employer: { id: employer.id} } } ),

          (context as any).meetingFeedback.deleteMany( { where: { meeting: { employerId: id } } }),
          (context as any).meetingScriptAnswer.deleteMany( { where: { protocol: { meeting: { employerId: employer.id } } } } ),
          (context as any).meetingScriptProtocol.deleteMany( { where: { meeting: { employerId: employer.id} } } ),
          (context as any).meeting.deleteMany( { where: { employerId: id} } ),

          (context as any).offer.deleteMany( { where: { vacancy: {employerId: employer.id} } } ),
          (context as any).vacancy.deleteMany( {where: { employerId: id} } ),

          (context as any).employer.delete({ where: { id } } ),
        ])
      },
    },
  },
})