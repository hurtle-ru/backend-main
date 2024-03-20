import * as yup from "yup"
import { ResumeExperience } from "@prisma/client";
import { start } from "repl";


export type BasicResumeExperience = Omit<
  ResumeExperience,
  | "resume"
>;


const BasicResumeExperienceScheme = yup.object({
  company: yup.string().trim().min(3).max(256).optional(),
  position: yup.string().trim().max(100),
  startMonth: yup.number().min(0).max(12),
  endMonth: yup.number().min(0).max(12).optional(),
  endYear: yup.number().min(1970).max(new Date().getFullYear()),
  startYear: yup.number().min(1970).max(new Date().getFullYear())
  .test({name: 'datesTest', 'test': function (item) {
    const startDate = new Date(this.parent.startYear, this.parent.startMonth)
    const endDate = new Date(this.parent.endYear, this.parent.endMonth)

    return startDate < endDate
  }}),
  description: yup.string().min(3).max(3000).optional(),
  resumeId: yup.string().length(36),
})

export class CreateResumeExperienceRequest {
  static schema = BasicResumeExperienceScheme.pick([
    "company",
    "position",
    "startMonth",
    "startYear",
    "endMonth",
    "endYear",
    "description",
    "resumeId",
  ])

  constructor(
    public company: string,
    public position: string,
    public startMonth: number,
    public startYear: number,
    public endMonth: number,
    public endYear: number,
    public description: string,
    public resumeId: string,
  ) {}
}

export class PutResumeExperienceRequest {
  static schema = BasicResumeExperienceScheme.pick([
    "company",
    "position",
    "startMonth",
    "startYear",
    "endMonth",
    "endYear",
    "description",
  ])

  constructor(
    public company: string,
    public position: string,
    public startMonth: number,
    public startYear: number,
    public endMonth: number,
    public endYear: number,
    public description: string,
  ) {}
}
