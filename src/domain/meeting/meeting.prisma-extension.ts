import { Prisma } from '@prisma/client'
import { prisma } from '../../infrastructure/database/prismaClient';
import { HttpError } from '../../infrastructure/error/httpError';


export const meetingPrismaExtension = Prisma.defineExtension({
  model: {
    meeting: {
      async archive(id: string) {
        const context = Prisma.getExtensionContext(this);
        const meeting = await (context as any).meeting.findUnique(
          {
            where: {id},
            include: {
              feedback: true,
              scriptProtocols: true,
            },
          })

        if (!meeting) throw new HttpError(404, "Meeting not found");

        await (context as any).softArchive.create({
          data: {
            modelName: context.name,
            originalId: meeting.id,
            payload: meeting,
          },
        })

        await (context as any).$transaction([
          (context as any).meetingFeedback.deleteMany( { where: { meeting: { id } } } ),
          (context as any).meetingScriptAnswer.deleteMany( { where: { protocol: { meeting: { id } } } } ),
          (context as any).meetingScriptProtocol.deleteMany( { where: { meeting: { id } } } ),

          (context as any).meeting.delete( { where: { id } } ),
        ])
      },
    },
  },
})