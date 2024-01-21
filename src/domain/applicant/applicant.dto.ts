import { Applicant } from "@prisma/client";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancy } from "../vacancy/vacancy.dto";
import { BasicResume } from "../resume/resume.dto";


export type BasicApplicant = Omit<
  Applicant,
  | "password"
  | "passwordId"
  | "resume"
  | "meetings"
  | "assignedVacancies"
>;

export type GetApplicantResponse = BasicApplicant & {
  resume?: BasicResume | null,
  meetings?: BasicMeeting[],
  assignedVacancies?: BasicVacancy[]
};

export type PutMeApplicantRequest = Pick<
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
  | "specialty"
  | "nickname"
  | "isReadyToRelocate"
  | "isVisibleToEmployers"
>

export type PutByIdApplicantRequest = Pick<
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
  | "specialty"
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