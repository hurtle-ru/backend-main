import * as yup from "yup";
import { Currency, Vacancy, VacancyEmploymentType, VacancyExperience, VacancyReportingForm, VacancyStatus, VacancyTeamRole, VacancyWorkingHours, VacancyWorkplaceModel } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicVacancyResponse } from "./response/response.dto"
import { RequesterEmployer, RequesterManager, APPLICANT, MANAGER, EMPLOYER } from "../../infrastructure/controller/requester/requester.dto";
import { yupEnum } from "../../infrastructure/validation/requests/enum.yup";
import { uint32 } from "../../infrastructure/validation/requests/int32.yup";
import { makeSchemeWithAllOptionalFields } from "../../infrastructure/validation/requests/optionalScheme";


export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "vacancyResponses"
  | "uniqueViewerApplicantIds"
  | "uniqueViewerIps"
>;

const BasicVacancyScheme = yup.object({
  name: yup.string().trim().min(3).max(50),
  teamRole: yupEnum(VacancyTeamRole),
  description: yup.string().trim().min(30).max(3000),
  shortDescription: yup.string().trim().min(10).max(255).optional(),
  salary: uint32().max(100_000_000),
  salaryCurrency: yupEnum(Currency),
  experience: yupEnum(VacancyExperience),
  employmentType: yupEnum(VacancyEmploymentType),
  price: uint32().optional(),
  city: yup.string().trim().min(3).max(255),
  reportingForm: yupEnum(VacancyReportingForm),
  workingHours: yupEnum(VacancyWorkingHours),
  workplaceModel: yupEnum(VacancyWorkplaceModel),
  status: yupEnum(VacancyStatus),
  keySkills: yup.array().of(yup.string().trim().min(3).max(50)).max(30),
  employerId: yup.string().length(36)
})


export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  vacancyResponses?: BasicVacancyResponse[];
  viewersCount: number;
};

export type GetAllVacancyCitiesResponse = { cities: string[], total: number };


export class CreateVacancyRequest {
  static scheme = BasicVacancyScheme.pick([
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
  static scheme = CreateVacancyRequest.scheme.concat(
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
  static scheme = CreateVacancyRequest.scheme.concat(
    BasicVacancyScheme.pick([
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
  static scheme = makeSchemeWithAllOptionalFields(PutVacancyRequestFromEmployer.scheme).concat(
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
  static scheme = makeSchemeWithAllOptionalFields(PutVacancyRequestFromManager.scheme).concat(
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
