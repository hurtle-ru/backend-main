import { Resume, Prisma } from "@prisma/client";
import { GetResumeResponse } from "./resume.dto";


export type ResumeToCheckIsFilled = {
  summary: string | null,
  skills: string[],
  certificates: object[],
  education: object[],
  experience: object[],
  languages: object[],
}

export const resumePrismaExtension = Prisma.defineExtension({
  model: {
    resume: {
      isFilled({ summary, skills, certificates, education, experience, languages }: ResumeToCheckIsFilled): boolean {
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
});