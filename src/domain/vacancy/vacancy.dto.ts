import * as yup from "yup";
import { Currency, Vacancy, VacancyEmploymentType, VacancyExperience, VacancyReportingForm, VacancyStatus, VacancyTeamRole, VacancyWorkingHours, VacancyWorkplaceModel } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicVacancyResponse } from "./response/response.dto"
import { MANAGER, EMPLOYER, RequesterEmployerSchema, RequesterManagerSchema } from "../../infrastructure/controller/requester/requester.dto";
import { yupOneOfEnum } from "../../infrastructure/validation/requests/enum.yup";
import { yupUint32 } from "../../infrastructure/validation/requests/int32.yup";


export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "vacancyResponses"
  | "uniqueViewerApplicantIds"
  | "uniqueViewerIps"
>;

const BasicVacancySchema: yup.ObjectSchema<BasicVacancy> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined().defined(),
  name: yup.string().defined().trim().min(0).max(50),
  teamRole: yupOneOfEnum(VacancyTeamRole).defined(),
  description: yup.string().defined().trim().min(0).max(3000),
  shortDescription: yup.string().defined().trim().min(0).max(500).nullable(),
  salary: yupUint32().defined().max(100_000_000),
  salaryCurrency: yupOneOfEnum(Currency).defined(),
  experience: yupOneOfEnum(VacancyExperience).defined(),
  employmentType: yupOneOfEnum(VacancyEmploymentType).defined(),
  price: yupUint32().defined().nullable(),
  city: yup.string().defined().trim().min(0).max(255),
  reportingForm: yupOneOfEnum(VacancyReportingForm).defined(),
  workingHours: yupOneOfEnum(VacancyWorkingHours).defined(),
  workplaceModel: yupOneOfEnum(VacancyWorkplaceModel).defined(),
  status: yupOneOfEnum(VacancyStatus).defined(),
  keySkills: yup.array().of(yup.string().defined().trim().min(0).max(50)).defined().max(30),
  employerId: yup.string().defined().length(36),
  isHidden: yup.boolean().defined(),
})


export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  vacancyResponses?: BasicVacancyResponse[];
  viewersCount: number;
};

export type GetAllVacancyCitiesResponse = { cities: string[], total: number };


export type CreateVacancyRequest = Pick<BasicVacancy,
  | "name"
  | "teamRole"
  | "description"
  | "shortDescription"
  | "salary"
  | "salaryCurrency"
  | "experience"
  | "employmentType"
  | "city"
  | "reportingForm"
  | "workingHours"
  | "workplaceModel"
  | "keySkills"
  | "isHidden"
>;

export const CreateVacancyRequestSchema: yup.ObjectSchema<CreateVacancyRequest> = BasicVacancySchema.pick([
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
  "isHidden"
])


export type PatchVacancyRequestFromEmployer = Partial<CreateVacancyRequest> & {
  _requester: EMPLOYER
}

export const PatchVacancyRequestFromEmployerSchema: yup.ObjectSchema<PatchVacancyRequestFromEmployer> = CreateVacancyRequestSchema.partial().concat(RequesterEmployerSchema)

export type PatchVacancyRequestFromManager = Partial<
    CreateVacancyRequest
    & Pick<BasicVacancy,
      | "price"
      | "status"
    >
  >
  & {_requester: MANAGER}

export const PatchVacancyRequestFromManagerSchema: yup.ObjectSchema<PatchVacancyRequestFromManager> = CreateVacancyRequestSchema.concat(
  BasicVacancySchema.pick([
    "price",
    "status",
  ])
).partial().concat(RequesterManagerSchema)
