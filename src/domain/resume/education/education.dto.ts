import * as yup from "yup"
import { ResumeEducation } from "@prisma/client";


export type BasicResumeEducation = Omit<
  ResumeEducation,
  | "resume"
>;

const BasicResumeEducationScheme = yup.object({
  name: yup.string().trim().min(3).max(50),
  description: yup.string().trim().min(3).max(255).optional(),
  degree: yup.string().trim().min(3).max(50),
  startYear: yup.number().min(1970).max(new Date().getFullYear()).optional(),
  endYear: yup.number().min(1970).max(new Date().getFullYear())
    .when("startYear", (startYear: any, schema: any) => {
      return schema.test({
        test: (endYear: any) => {
          return !startYear || endYear > startYear;
        },
        message: "Approved Amount not gether then billAmount",
      })
    }),
  resumeId: yup.string().length(36),
})

export class CreateResumeEducationRequest {
  static schema = BasicResumeEducationScheme.pick([
    "name",
    "description",
    "degree",
    "startYear",
    "endYear",
    "resumeId",
  ])

  constructor (
    public name: string,
    public description: string,
    public degree: string,
    public startYear: number,
    public endYear: number,
    public resumeId: string,
  ) {}
}

export class PutResumeEducationRequest {
  static schema = BasicResumeEducationScheme.pick([
    "name",
    "description",
    "degree",
    "startYear",
    "endYear",
  ])

  constructor (
    public name: string,
    public description: string,
    public year: number,
  ) {}
}
