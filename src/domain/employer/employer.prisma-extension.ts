import { Prisma } from '@prisma/client'
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
        const context = Prisma.getExtensionContext(this)
const result = await (context as any).findFirst({ where })

        const employer = await prisma.employer.findUnique(
          {
            where: {id},
            include: {
              lega: true,
              password: true,
              resume: true,
              meetings: true,
              assignedVacancies: true,
              offers: true,
            },
          })

        if (!employer) {
          throw new HttpError(404, "Employer not found")
        }

        await prisma.softArchive.create({
          data: {
            modelName: "Applicant",
            originalId: employer.id,
            payload: JSON.stringify(employer),
          },
        })
        prisma.applicant.delete({where: {id}})
      },
    },
  },
})