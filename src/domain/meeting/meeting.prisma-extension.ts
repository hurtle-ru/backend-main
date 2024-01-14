import { Prisma } from '@prisma/client'


export const meetingPrismaExtension = Prisma.defineExtension({
  model: {
    meeting: {
      async archive(id: string) {
        return {"test": "testing"}
      },
    },
  },
})