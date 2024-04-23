import * as yup from "yup";
import { Applicant, ApplicantAiChat, Gender, } from "@prisma/client";
import { BasicMeeting, } from "../meeting/meeting.dto";
import { BasicVacancyResponse, } from "../vacancy/response/response.dto";
import { BasicResume, } from "../resume/resume.dto";
import { yupOneOfEnum, } from "../../infrastructure/validation/requests/enum.yup";


export type BasicApplicant = Pick<
  Applicant,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "email"
  | "login"
  | "contact"
  | "firstName"
  | "middleName"
  | "lastName"
  | "phone"
  | "birthDate"
  | "gender"
  | "city"
  | "country"
  | "aboutMe"
  | "nickname"
  | "isReadyToRelocate"
  | "isVisibleToEmployers"
  | "isConfirmedByManager"
  | "isEmailConfirmed"
  | "googleTokenSub"
>;

export const BasicApplicantSchema: yup.ObjectSchema<BasicApplicant> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  email: yup.string().defined().email().min(3,).max(255,),
  login: yup.string().defined().trim().min(3,).max(255,),
  contact: yup.string().defined().trim().min(1,).max(36,),
  firstName: yup.string().defined().trim().min(2,).max(50,),
  middleName: yup.string().defined().trim().min(1,).max(50,).nullable(),
  lastName: yup.string().defined().trim().min(2,).max(50,),
  phone: yup.string().defined().trim().min(2,).max(15,).nullable(),
  birthDate: yup.date().defined().min(new Date(1900, 0,),).max(new Date().getFullYear() - 13,).nullable(),
  gender: yupOneOfEnum(Gender,).defined().nullable(),
  city: yup.string().defined().trim().min(3,).max(255,).nullable(),
  country: yup.string().defined().trim().min(3,).max(62,).nullable(),
  aboutMe: yup.string().defined().trim().min(2,).max(3000,).nullable(),
  nickname: yup.string().defined().trim().min(2,).max(50,).nullable(),
  isReadyToRelocate: yup.boolean().defined().nullable(),
  isVisibleToEmployers: yup.boolean().defined(),
  isConfirmedByManager: yup.boolean().defined(),
  isEmailConfirmed: yup.boolean().defined(),
  googleTokenSub: yup.string().defined().nullable(),
},);

export type GetApplicantResponse = BasicApplicant & {
  resume?: BasicResume | null,
  meetings?: BasicMeeting[],
  vacancyResponses?: BasicVacancyResponse[],
  aiChats?: ApplicantAiChat[],
};

export type GetApplicantStatusResponse = {
  isEmailConfirmed: boolean,
  hasResume: boolean,
  hasMeeting: boolean,
  isResumeFilled: boolean,
}

export type PatchMeApplicantRequest = Partial<
  Pick<BasicApplicant,
    | "contact"
    | "firstName"
    | "middleName"
    | "lastName"
    | "phone"
    | "birthDate"
    | "gender"
    | "city"
    | "country"
    | "aboutMe"
    | "nickname"
    | "isReadyToRelocate"
    | "isVisibleToEmployers"
  >
>;

export const PatchMeApplicantRequestSchema: yup.ObjectSchema<PatchMeApplicantRequest> = BasicApplicantSchema.pick([
  "contact",
  "firstName",
  "middleName",
  "lastName",
  "phone",
  "birthDate",
  "gender",
  "city",
  "country",
  "aboutMe",
  "nickname",
  "isReadyToRelocate",
  "isVisibleToEmployers",
],).partial();

export type PatchByIdApplicantRequest = Partial<
  Pick<BasicApplicant,
    | "email"
    | "login"
    | "contact"
    | "firstName"
    | "middleName"
    | "lastName"
    | "phone"
    | "birthDate"
    | "gender"
    | "city"
    | "country"
    | "aboutMe"
    | "nickname"
    | "isReadyToRelocate"
    | "isVisibleToEmployers"
    | "isConfirmedByManager"
  >
>;

export const PatchByIdApplicantRequestSchema: yup.ObjectSchema<PatchByIdApplicantRequest> = BasicApplicantSchema.pick([
  "email",
  "login",
  "contact",
  "firstName",
  "middleName",
  "lastName",
  "phone",
  "birthDate",
  "gender",
  "city",
  "country",
  "aboutMe",
  "nickname",
  "isReadyToRelocate",
  "isVisibleToEmployers",
  "isConfirmedByManager",
],).partial();
