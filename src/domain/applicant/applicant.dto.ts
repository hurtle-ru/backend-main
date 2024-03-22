import * as yup from "yup";
import { DateWithoutTime } from "../../infrastructure/controller/date/date.dto";
import { Applicant, ApplicantAiChat, Gender } from "@prisma/client";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancyResponse } from "../vacancy/response/response.dto";
import { BasicResume } from "../resume/resume.dto";

import { yupEnum } from "../../infrastructure/validation/requests/enum.yup"


export type BasicApplicant = Omit<
  Applicant,
  | "password"
  | "resume"
  | "meetings"
  | "vacancyResponses"
  | "aiChats"
>;

export type GetApplicantResponse = BasicApplicant & {
  resume?: BasicResume | null,
  meetings?: BasicMeeting[],
  vacancyResponses?: BasicVacancyResponse[],
  aiChats?: ApplicantAiChat[],
};

const BasicApplicantSchema = yup.object({
  email: yup.string().email().min(3).max(255),
  login: yup.string().trim().min(3).max(255),
  contact: yup.string().trim().min(1).max(36),
  firstName: yup.string().trim().min(2).max(50),
  middleName: yup.string().trim().min(1).max(50).optional(),
  lastName: yup.string().trim().min(2).max(50),
  phone: yup.string().trim().min(2).max(15).optional(),
  birthDate: yup.date().min(2000).max(new Date().getFullYear() - 13).optional(),
  gender: yupEnum(Gender).optional(),
  city: yup.string().trim().min(3).max(255).optional(),
  country: yup.string().trim().min(3).max(62).optional(),
  aboutMe: yup.string().trim().min(2).max(3000).optional(),
  nickname: yup.string().trim().min(2).max(50).optional(),
  isReadyToRelocate: yup.boolean().optional(),
  isVisibleToEmployers: yup.boolean(),
  isConfirmedByManager: yup.boolean(),
})

export class PutMeRequestByApplicant {
  static schema = BasicApplicantSchema.pick(
    [
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
    ])

  constructor(
    public contact: string,
    public firstName: string,
    public middleName: string,
    public lastName: string,
    public phone: string,
    public birthDate: DateWithoutTime,
    public gender: keyof typeof Gender,
    public city: string,
    public country: string,
    public aboutMe: string,
    public nickname: string,
    public isReadyToRelocate: boolean,
    public isVisibleToEmployers: boolean,
  ) {}
}

export class PutByIdRequestByApplicant {
  static schema = BasicApplicantSchema.pick([
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
    ])

  constructor(
    public email: string,
    public login: string,
    public contact: string,
    public firstName: string,
    public middleName: string,
    public lastName: string,
    public phone: string,
    public birthDate: DateWithoutTime,
    public gender: keyof typeof Gender,
    public city: string,
    public country: string,
    public aboutMe: string,
    public nickname: string,
    public isReadyToRelocate: boolean,
    public isVisibleToEmployers: boolean,
    public isConfirmedByManager: boolean,
  ) {}
}

export type GetApplicantStatusResponse = {
  isEmailConfirmed: boolean,
  hasResume: boolean,
  hasMeeting: boolean,
}
