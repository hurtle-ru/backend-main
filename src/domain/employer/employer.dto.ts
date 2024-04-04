import * as yup from 'yup'
import { Employer, EmployerLegalForm, EmployerSize } from "@prisma/client";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancy } from "../vacancy/vacancy.dto";
import { yupUint32 } from '../../infrastructure/validation/requests/int32.yup';
import { yupOneOfEnum } from '../../infrastructure/validation/requests/enum.yup';


export type BasicEmployer = Omit<
  Employer,
  | "password"
  | "meetings"
  | "vacancies"
>;

export const BasicEmployerSchema: yup.ObjectSchema<BasicEmployer> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  email: yup.string().defined().email().min(3).max(255),
  login: yup.string().defined().trim().min(3).max(255),
  contact: yup.string().defined().trim().min(1).max(36),
  firstName: yup.string().defined().trim().min(2).max(50),
  middleName: yup.string().defined().trim().min(1).max(50).nullable(),
  lastName: yup.string().defined().trim().min(2).max(50),
  phone: yup.string().defined().trim().min(2).max(15).nullable(),
  name: yup.string().defined().trim().min(2),
  inn: yup.string().defined().trim().min(10).max(12).nullable(),
  ogrn: yup.string().defined().trim().length(13).nullable(),
  legalForm: yupOneOfEnum(EmployerLegalForm).defined(),
  agreementNumber: yupUint32().defined().nullable(),
  agreementDate: yup.date().defined().nullable(),
  isConfirmedByManager: yup.boolean().defined(),
  isEmailConfirmed: yup.boolean().defined(),
  city: yup.string().defined().trim().min(2).max(255).nullable(),
  isStartup: yup.boolean().defined(),
  size: yupOneOfEnum(EmployerSize).defined(),
  website: yup.string().defined().trim().min(4).max(100).nullable(),
  description: yup.string().defined().trim().max(3000).nullable(),
})

export type GetEmployerResponse = BasicEmployer & {
  meetings?: BasicMeeting[],
  vacancies?: BasicVacancy[]
};

export type PatchMeByEmployerRequest = Partial<Pick<
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
>>

export const PatchMeByEmployerRequestSchema: yup.ObjectSchema<PatchMeByEmployerRequest> = BasicEmployerSchema.pick([
  "contact",
  "firstName",
  "middleName",
  "lastName",
  "phone",
  "name",
  "inn",
  "ogrn",
  "legalForm",
  "city",
  "isStartup",
  "size",
  "website",
  "description",
]).partial()


export type PatchByIdByEmployerRequest = Partial<Pick<
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
>>

export const PatchByIdByEmployerRequestSchema: yup.ObjectSchema<PatchByIdByEmployerRequest> = BasicEmployerSchema.pick([
  "email",
  "login",
  "contact",
  "firstName",
  "middleName",
  "lastName",
  "phone",
  "name",
  "inn",
  "ogrn",
  "legalForm",
  "agreementNumber",
  "agreementDate",
  "isConfirmedByManager",
  "city",
  "isStartup",
  "size",
  "website",
  "description",
])
