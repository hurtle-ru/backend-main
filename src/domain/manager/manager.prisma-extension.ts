import { Prisma } from '@prisma/client'
import { prisma } from '../../infrastructure/database/prismaClient';
import { HttpError } from '../../infrastructure/error/httpError';


export const managerPrismaExtension = Prisma.defineExtension({
  result: {
    manager: {
      passwordId: {
        needs: {},
        compute() {
          return undefined;
        },
      },
    },
  },
  model: {
    manager: {
      async archive(id: string) {
        const context = Prisma.getExtensionContext(this);
        const manager = await (context as any).manager.findUnique(
          {
            where: {id},
            include: {
              password: true,
              slots: true,
            },
          })

        if (!manager) throw new HttpError(404, "Manager not found");

        await (context as any).softArchive.create({
          data: {
            modelName: context.name,
            originalId: manager.id,
            payload: manager,
          },
        })

        await (context as any).$transaction([
          (context as any).password.deleteMany( { where: { manager: { id: manager.id} } } ),

          (context as any).meetingFeedback.deleteMany( { where: { meeting: { employerId: id } } } ),
          (context as any).meetingScriptAnswer.deleteMany( { where: { protocol: { meeting: { slot: { managerId: manager.id} } } } } ),
          (context as any).meetingScriptProtocol.deleteMany( { where: { meeting: { slot: { managerId: manager.id} } } } ),
          (context as any).meeting.deleteMany( { where: { slot: { managerId: manager.id } } } ),

          (context as any).manager.delete( { where: {id} } ),
        ])
      },
    },
  },
})