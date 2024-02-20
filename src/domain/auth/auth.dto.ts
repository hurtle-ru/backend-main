import yup from "../../infrastructure/validation/yup.provider";
import { DateWithoutTime } from "../../infrastructure/controller/date/date.dto";


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
