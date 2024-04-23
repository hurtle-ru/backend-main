import { Resume, Prisma, } from "@prisma/client";
import { GetResumeResponse, } from "./resume.dto";


export const resumePrismaExtension = Prisma.defineExtension({
  model: {
    resume: {
      isFilled({ summary, skills, certificates, education, experience, languages, }: {
        summary: string | null,
        skills: string[],
        certificates: object[],
        education: object[],
        experience: object[],
        languages: object[],
      },): boolean {
        return !!(
          summary
          || (skills && skills.length > 0)
          || (certificates && certificates.length > 0)
          || (education && education.length > 0)
          || (experience && experience.length > 0)
          || (languages && languages.length > 0)
        );
      },
    },
  },
},);