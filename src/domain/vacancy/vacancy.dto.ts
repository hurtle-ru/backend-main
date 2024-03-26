import * as yup from "yup";
import { Currency, Vacancy, VacancyEmploymentType, VacancyExperience, VacancyReportingForm, VacancyStatus, VacancyTeamRole, VacancyWorkingHours, VacancyWorkplaceModel } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicVacancyResponse } from "./response/response.dto"
import { RequesterEmployer, RequesterManager, APPLICANT, MANAGER, EMPLOYER } from "../../infrastructure/controller/requester/requester.dto";
import { yupOneOfEnum } from "../../infrastructure/validation/requests/enum.yup";
import { yupUint32 } from "../../infrastructure/validation/requests/int32.yup";
import { makeSchemaWithAllOptionalFields } from "../../infrastructure/validation/requests/utils.yup";


export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "vacancyResponses"
  | "uniqueViewerApplicantIds"
  | "uniqueViewerIps"
>;

const BasicVacancySchema = yup.object({
  name: yup.string().trim().min(3).max(50),
  teamRole: yupOneOfEnum(VacancyTeamRole),
  description: yup.string().trim().min(30).max(3000),
  shortDescription: yup.string().trim().min(10).max(255).optional(),
  salary: yupUint32().max(100_000_000),
  salaryCurrency: yupOneOfEnum(Currency),
  experience: yupOneOfEnum(VacancyExperience),
  employmentType: yupOneOfEnum(VacancyEmploymentType),
  price: yupUint32().optional(),
  city: yup.string().trim().min(3).max(255),
  reportingForm: yupOneOfEnum(VacancyReportingForm),
  workingHours: yupOneOfEnum(VacancyWorkingHours),
  workplaceModel: yupOneOfEnum(VacancyWorkplaceModel),
  status: yupOneOfEnum(VacancyStatus),
  keySkills: yup.array().of(yup.string().trim().min(3).max(50)).max(30),
  employerId: yup.string().length(36),
})


export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  vacancyResponses?: BasicVacancyResponse[];
  viewersCount: number;
};

export type GetAllVacancyCitiesResponse = { cities: string[], total: number };


export class CreateVacancyRequest {
  static schema = BasicVacancySchema.pick([
    "name",
    "teamRole",
    "description",
    "shortDescription",
    "salary",
    "salaryCurrency",
    "experience",
    "employmentType",
    "city",
    "reportingForm",
    "workingHours",
    "workplaceModel",
    "keySkills",
  ])

  constructor(
    public name: string,
    public teamRole: keyof typeof VacancyTeamRole,
    public description: string,
    public shortDescription: string,
    public salary: number,
    public salaryCurrency: keyof typeof Currency,
    public experience: keyof typeof VacancyExperience,
    public employmentType: keyof typeof VacancyEmploymentType,
    public city: string,
    public reportingForm: keyof typeof VacancyReportingForm,
    public workingHours: keyof typeof VacancyWorkingHours,
    public workplaceModel: keyof typeof VacancyWorkplaceModel,
    public keySkills: string[],
  ) {}
}

export class PutVacancyRequestFromEmployer {
  static schema = CreateVacancyRequest.schema.concat(
    yup.object({
      _requester: yup.string(),
    })
  )

  constructor(
    public name: string,
    public teamRole: keyof typeof VacancyTeamRole,
    public description: string,
    public shortDescription: string,
    public salary: number,
    public salaryCurrency: keyof typeof Currency,
    public experience: keyof typeof VacancyExperience,
    public employmentType: keyof typeof VacancyEmploymentType,
    public city: string,
    public reportingForm: keyof typeof VacancyReportingForm,
    public workingHours: keyof typeof VacancyWorkingHours,
    public workplaceModel: keyof typeof VacancyWorkplaceModel,
    public keySkills: string[],
    public _requester: EMPLOYER,
  ) {}
}

export class PutVacancyRequestFromManager {
  static schema = CreateVacancyRequest.schema.concat(
    BasicVacancySchema.pick([
      "price",
      "status",
    ])
  ).concat(
    yup.object({
      _requester: yup.string(),
    })
  )

  constructor(
    public name: string,
    public teamRole: keyof typeof VacancyTeamRole,
    public description: string,
    public shortDescription: string,
    public salary: number,
    public salaryCurrency: keyof typeof Currency,
    public experience: keyof typeof VacancyExperience,
    public employmentType: keyof typeof VacancyEmploymentType,
    public price: number,
    public city: string,
    public reportingForm: keyof typeof VacancyReportingForm,
    public workingHours: keyof typeof VacancyWorkingHours,
    public workplaceModel: keyof typeof VacancyWorkplaceModel,
    public status: keyof typeof VacancyStatus,
    public keySkills: string[],
    public _requester: MANAGER,
  ) {}
}

export class PatchVacancyRequestFromEmployer {
  static schema = makeSchemaWithAllOptionalFields(PutVacancyRequestFromEmployer.schema).concat(
    yup.object({
      _requester: yup.string(),
    })
  )

  constructor(
    public name?: string,
    public teamRole?: keyof typeof VacancyTeamRole,
    public description?: string,
    public shortDescription?: string,
    public salary?: number,
    public salaryCurrency?: keyof typeof Currency,
    public experience?: keyof typeof VacancyExperience,
    public employmentType?: keyof typeof VacancyEmploymentType,
    public city?: string,
    public reportingForm?: keyof typeof VacancyReportingForm,
    public workingHours?: keyof typeof VacancyWorkingHours,
    public workplaceModel?: keyof typeof VacancyWorkplaceModel,
    public keySkills?: string[],
    public _requester?: EMPLOYER,
  ) {}
}

export class PatchVacancyRequestFromManager {
  static schema = makeSchemaWithAllOptionalFields(PutVacancyRequestFromManager.schema).concat(
    yup.object({
      _requester: yup.string(),
    })
  )

  constructor(
    public name?: string,
    public teamRole?: keyof typeof VacancyTeamRole,
    public description?: string,
    public shortDescription?: string,
    public salary?: number,
    public salaryCurrency?: keyof typeof Currency,
    public experience?: keyof typeof VacancyExperience,
    public employmentType?: keyof typeof VacancyEmploymentType,
    public price?: number,
    public city?: string,
    public reportingForm?: keyof typeof VacancyReportingForm,
    public workingHours?: keyof typeof VacancyWorkingHours,
    public workplaceModel?: keyof typeof VacancyWorkplaceModel,
    public status?: keyof typeof VacancyStatus,
    public keySkills?: string[],
    public _requester?: MANAGER,
  ) {}
}
