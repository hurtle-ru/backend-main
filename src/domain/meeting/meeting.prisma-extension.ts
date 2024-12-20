import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError } from "../../infrastructure/error/http.error";


export const meetingPrismaExtension = Prisma.defineExtension({
  model: {
    meeting: {
      async archive(id: string) {
        const context = Prisma.getExtensionContext(this);
        const meeting = await prisma.meeting.findUnique({
          where: { id },
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
        });

        if (!meeting) throw new HttpError(404, "Meeting not found");

        await prisma.meeting.delete({ where: { id } });
        await prisma.softArchive.create({
          data: {
            modelName: context.name,
            originalId: meeting.id,
            payload: meeting,
          },
        });
      },
    },
  },
});