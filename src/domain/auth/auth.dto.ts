import * as yup from "yup";
import { setLocale } from "yup";
import { ru } from "yup-locales";
import { DateWithoutTime } from "../../infrastructure/controller/date/date.dto";

setLocale(ru);

export interface JwtModel {
  user: {
    id: string;
    role: UserRole;
    iat: number;
  };
}

export enum UserRole {
  "APPLICANT" = "APPLICANT",
  "EMPLOYER" = "EMPLOYER",
  "MANAGER" = "MANAGER",
}

export interface CreateAccessTokenRequest {
  login: string;
  password: string;
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
    middleName: yup.string().trim().min(1),
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

export class RegisterEmployerRequest {
  static schema = yup.object({
    email: yup.string().email().min(3),
    contact: yup.string().trim().min(1),
    password: yup.string().trim().min(8),
    firstName: yup.string().trim().min(1),
    lastName: yup.string().trim().min(1),
    middleName: yup.string().trim().min(1),
  });

  constructor(
    public email: string,
    public contact: string,
    public password: string,
    public lastName: string,
    public firstName: string,
    public middleName?: string,
  ) {}
}
