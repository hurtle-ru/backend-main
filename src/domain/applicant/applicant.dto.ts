import { Applicant, ApplicantAiChat } from "@prisma/client";
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

export type PutMeRequestByApplicant = Pick<
  BasicApplicant,
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

export type PutByIdRequestByApplicant = Pick<
  BasicApplicant,
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

export type GetApplicantStatusResponse = {
  isEmailConfirmed: boolean,
  hasResume: boolean,
  hasMeeting: boolean,
}