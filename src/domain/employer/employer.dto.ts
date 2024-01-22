import { Employer } from "@prisma/client";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancy } from "../vacancy/vacancy.dto";


export type BasicEmployer = Omit<
  Employer,
  | "password"
  | "passwordId"
  | "meetings"
  | "vacancies"
>;

export type GetEmployerResponse = BasicEmployer & {
  meetings?: BasicMeeting[],
  vacancies?: BasicVacancy[]
};

export type PutMeEmployerRequest = Pick<
  BasicEmployer,
  | "contact"
  | "firstName"
  | "middleName"
  | "lastName"
  | "phone"
  | "name"
  | "inn"
  | "ogrn"
  | "legalForm"
  | "city"
  | "isStartup"
  | "size"
  | "website"
  | "description"
>

export type PutByIdEmployerRequest = Pick<
  BasicEmployer,
  | "email"
  | "login"
  | "contact"
  | "firstName"
  | "middleName"
  | "lastName"
  | "phone"
  | "name"
  | "inn"
  | "ogrn"
  | "legalForm"
  | "agreementNumber"
  | "agreementDate"
  | "isConfirmedByManager"
  | "city"
  | "isStartup"
  | "size"
  | "website"
  | "description"
>