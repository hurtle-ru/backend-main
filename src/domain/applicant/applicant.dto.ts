import { Applicant } from "@prisma/client";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancy } from "../vacancy/vacancy.dto";


export type BasicApplicant = Omit<
  Applicant,
  | "password"
  | "passwordId"
  | "resume"
  | "meetings"
  | "assignedVacancies"
>;

export type GetApplicantResponse = BasicApplicant & {
  resume?: any,
  meetings?: BasicMeeting[],
  assignedVacancies?: BasicVacancy[]
};

export type ApplicantPutMeRequest = Pick<
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

export type ApplicantPutByIdRequest = Pick<
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