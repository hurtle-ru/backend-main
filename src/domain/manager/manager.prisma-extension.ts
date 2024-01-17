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
        const manager = await prisma.manager.findUnique(
          {
            where: {id},
            include: {
              password: true,
              slots: true,
            },
          })

        if (!manager) throw new HttpError(404, "Manager not found");

        await prisma.$transaction([
          prisma.password.deleteMany( { where: { manager: { id: manager.id} } } ),

          prisma.meetingFeedback.deleteMany( { where: { meeting: { employerId: id } } } ),
          prisma.meetingScriptAnswer.deleteMany( { where: { protocol: { meeting: { slot: { managerId: manager.id} } } } } ),
          prisma.meetingScriptProtocol.deleteMany( { where: { meeting: { slot: { managerId: manager.id} } } } ),
          prisma.meeting.deleteMany( { where: { slot: { managerId: manager.id } } } ),

          prisma.manager.delete( { where: {id} } ),
        ]);

        await prisma.softArchive.create({
          data: {
            modelName: context.name,
            originalId: manager.id,
            payload: manager,
          },
        });
      },
    },
  },
})