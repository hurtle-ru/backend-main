import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError } from "../../infrastructure/error/http.error";


export const managerPrismaExtension = Prisma.defineExtension({
  model: {
    manager: {

      /*
      * На момент 19.01.2024+ каскадное удаление не проводится для slots.
      * Но они будет включены в архив во избежание потери данных об авторстве слотов.
      **/
      async archive(id: string) {
        const context = Prisma.getExtensionContext(this);
        const manager = await prisma.manager.findUnique({
          where: { id },
          include: {
            password: true,
            slots: {
              include: {
                payments: {
                  include: {
                    appliedPromoCode: true,
                  },
                },
              },
            },
          },
        });

        if (!manager) throw new HttpError(404, "Manager not found");

        await prisma.manager.delete({ where: { id } });
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
});