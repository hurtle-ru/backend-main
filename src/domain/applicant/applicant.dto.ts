import * as yup from "yup";
import { DateWithoutTime } from "../../infrastructure/controller/date/date.dto";
import { Applicant, ApplicantAiChat, Gender } from "@prisma/client";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancyResponse } from "../vacancy/response/response.dto";
import { BasicResume } from "../resume/resume.dto";


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

const BasicYupApplicant = {
  email: yup.string().email().min(3).max(255),
  login: yup.string().email().min(3).max(255),
  contact: yup.string().trim().min(1).max(36),
  firstName: yup.string().trim().min(2).max(50),
  middleName: yup.string().trim().min(1).optional().max(50),
  lastName: yup.string().trim().min(2).max(50),
  phone: yup.string().trim().min(2).max(15),
  birthDate: yup.date(),
  gender: yup.mixed().oneOf(Object.values(Gender)),
  city: yup.string().trim().min(3).max(255),
  country: yup.string().trim().min(3).max(62),
  aboutMe: yup.string().trim().min(2).max(3000),
  nickname: yup.string().trim().min(2).max(50),
  isReadyToRelocate: yup.boolean(),
  isVisibleToEmployers: yup.boolean(),
  isConfirmedByManager: yup.boolean(),
}

export class PutMeRequestByApplicant {
  static schema = yup.object({
    contact: BasicYupApplicant["contact"],
    firstName: BasicYupApplicant["firstName"],
    middleName: BasicYupApplicant["middleName"],
    lastName: BasicYupApplicant["lastName"],
    phone: BasicYupApplicant["phone"],
    birthDate: BasicYupApplicant["birthDate"],
    gender: BasicYupApplicant["gender"],
    city: BasicYupApplicant["city"],
    country: BasicYupApplicant["country"],
    aboutMe: BasicYupApplicant["aboutMe"],
    nickname: BasicYupApplicant["nickname"],
    isReadyToRelocate: BasicYupApplicant["isReadyToRelocate"],
    isVisibleToEmployers: BasicYupApplicant["isVisibleToEmployers"],
  });

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
  static schema = yup.object({
    email: BasicYupApplicant["email"],
    login: BasicYupApplicant["login"],
    contact: BasicYupApplicant["contact"],
    firstName: BasicYupApplicant["firstName"],
    middleName: BasicYupApplicant["middleName"],
    lastName: BasicYupApplicant["lastName"],
    phone: BasicYupApplicant["phone"],
    birthDate: BasicYupApplicant["birthDate"],
    gender: BasicYupApplicant["gender"],
    city: BasicYupApplicant["city"],
    country: BasicYupApplicant["country"],
    aboutMe: BasicYupApplicant["aboutMe"],
    nickname: BasicYupApplicant["nickname"],
    isReadyToRelocate: BasicYupApplicant["isReadyToRelocate"],
    isVisibleToEmployers: BasicYupApplicant["isVisibleToEmployers"],
    isConfirmedByManager: BasicYupApplicant["isConfirmedByManager"],
  })

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