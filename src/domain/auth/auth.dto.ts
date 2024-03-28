import { DateWithoutTime } from "../../infrastructure/controller/date/date.dto";
import * as yup from "yup";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicHhToken, HhAuthorizationCodeRequest, HhAuthorizationCodeRequestSchema } from "../../external/hh/auth/auth.dto";
import { HhToken } from "@prisma/client";


export interface JwtModel {
  user: {
    id: string; // Contains model id or email if the user is Guest
    role: UserRole | typeof GUEST_ROLE;
    iat: number;
  };
}

export enum UserRole {
  "APPLICANT" = "APPLICANT",
  "EMPLOYER" = "EMPLOYER",
  "MANAGER" = "MANAGER",
}

export const GUEST_ROLE = "GUEST";
export const PUBLIC_SCOPE = "PUBLIC";

export interface CreateAccessTokenRequest {
  login: string;
  password: string;
}

export class CreateGuestAccessTokenRequest {
  static schema = yup.object({
    email: yup.string().email().min(3),
  });

  constructor(
    public email: string,
  ) {}
}

export interface CreateAccessTokenResponse {
  token: string;
}

export class RegisterApplicantRequest {
  static schema = yup.object({
    email: yup.string().email().min(3),
    contact: yup.string().trim().min(1),
    birthDate: yup.date(),
    password: yup.string().trim().min(8),
    firstName: yup.string().trim().min(1),
    lastName: yup.string().trim().min(1),
    middleName: yup.string().trim().min(1).optional(),
  });

  constructor(
    public email: string,
    public contact: string,
    public birthDate: DateWithoutTime,
    public password: string,
    public lastName: string,
    public firstName: string,
    public middleName?: string,
  ) {}
}

// will be fixed in 'validation' task
export type _RegisterApplicantRequest = Pick<BasicApplicant,
  | "email"
  | "contact"
  | "birthDate"
  | "lastName"
  | "firstName"
  | "middleName"
>

export const _RegisterApplicantRequestSchema: yup.ObjectSchema<_RegisterApplicantRequest> = yup.object({
  email: yup.string().defined().email().min(3),
  contact: yup.string().defined().trim().min(1),
  firstName: yup.string().defined().trim().min(1),
  lastName: yup.string().defined().trim().min(1),
  middleName: yup.string().defined().trim().min(1).nullable(),
  birthDate: yup.date().defined().defined()
})

export class RegisterEmployerRequest {
  static schema = yup.object({
    name: yup.string().trim().min(2),
    email: yup.string().email().min(3),
    contact: yup.string().trim().min(1),
    password: yup.string().trim().min(8),
    firstName: yup.string().trim().min(1),
    lastName: yup.string().trim().min(1),
    middleName: yup.string().trim().min(1).optional(),
  });

  constructor(
    public name: string,
    public email: string,
    public contact: string,
    public password: string,
    public lastName: string,
    public firstName: string,
    public middleName?: string,
  ) {}
}

export class RegisterApplicantWithGoogleRequest {
  static schema = yup.object({
    googleToken: yup.string(),
    contact: yup.string().trim().min(1),
    birthDate: yup.date(),
    firstName: yup.string().trim().min(1),
    lastName: yup.string().trim().min(1),
    middleName: yup.string().trim().min(1).optional(),
  });

  constructor(
    public googleToken: string,
    public contact: string,
    public birthDate: DateWithoutTime,
    public lastName: string,
    public firstName: string,
    public middleName?: string,
  ) {}
}

export type registerApplicantHhToken = BasicHhToken & Pick<HhToken, "hhApplicantId">

export type RegisterApplicantWithHhRequest = _RegisterApplicantRequest & HhAuthorizationCodeRequest

export const RegisterApplicantWithHhRequestSchema: yup.ObjectSchema<RegisterApplicantWithHhRequest> = _RegisterApplicantRequestSchema.concat(HhAuthorizationCodeRequestSchema)

export type AuthWithHhRequest = {
  role: "APPLICANT"; // todo will be imported const after 'validation' task
} & HhAuthorizationCodeRequest

export const AuthWithHhRequestSchema: yup.ObjectSchema<AuthWithHhRequest> = HhAuthorizationCodeRequestSchema.shape({
  role: yup.string().defined().oneOf(["APPLICANT"] as const) // todo will be imported const after 'validation' task
})
