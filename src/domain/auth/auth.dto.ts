import * as yup from "yup";
import { BasicApplicant, BasicApplicantSchema, } from "../applicant/applicant.dto";
import {
  AuthWithHhUserAccountResponse,
  BasicHhToken,
  BasicHhTokenSchema,
  HH_AUTHORIZATION_CODE,
  HH_TOKEN,
  HhAuthorizationCodeRequest,
  HhAuthorizationCodeRequestSchema,
} from "../../external/hh/auth/auth.dto";
import { HhToken, } from "@prisma/client";
import { APPLICANT, APPLICANT_SCHEMA, } from "../../infrastructure/controller/requester/requester.dto";
import { GoogleTokenSchema, } from "../../external/google/auth/auth.dto";
import { BasicEmployer, BasicEmployerSchema, } from "../employer/employer.dto";


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

export const PasswordSchema = yup.string().trim().min(8,).defined();


export interface CreateAccessTokenRequest {
  login: string;
  password: string;
}

export interface CreateAccessTokenResponse {
  token: string;
}


export type CreateGuestAccessTokenRequest = Pick<BasicApplicant, "email">
export const CreateGuestAccessTokenRequestSchema: yup.ObjectSchema<CreateGuestAccessTokenRequest> = BasicApplicantSchema.pick(["email",],);


export type RegisterEmployerRequest = Pick<BasicEmployer,
  | "name"
  | "email"
  | "contact"
  | "firstName"
  | "lastName"
  | "middleName"
> & { password: string }

export const RegisterEmployerRequestSchema: yup.ObjectSchema<RegisterEmployerRequest> = BasicEmployerSchema.pick([
  "name",
  "email",
  "contact",
  "firstName",
  "lastName",
  "middleName",
],).shape({password: PasswordSchema,},);


export type RegisterApplicantRequest = Pick<BasicApplicant,
  | "email"
  | "contact"
  | "birthDate"
  | "lastName"
  | "firstName"
  | "middleName"
> & { password: string }

export const RegisterApplicantRequestSchema: yup.ObjectSchema<RegisterApplicantRequest> = BasicApplicantSchema.pick([
  "email",
  "contact",
  "birthDate",
  "lastName",
  "firstName",
  "middleName",
],).shape({password: PasswordSchema,},);


export type RegisterApplicantWithHhRequest = Pick<BasicApplicant,
  | "email"
  | "contact"
  | "birthDate"
  | "lastName"
  | "firstName"
  | "middleName"
>

export const RegisterApplicantWithHhRequestSchema: yup.ObjectSchema<RegisterApplicantWithHhRequest> = BasicApplicantSchema.pick([
  "email",
  "contact",
  "birthDate",
  "lastName",
  "firstName",
  "middleName",
],);


export type RegisterApplicantWithGoogleRequest = Pick<BasicApplicant,
  | "contact"
  | "birthDate"
  | "lastName"
  | "firstName"
  | "middleName"
> & { googleToken: string, email: string | null }

export const RegisterApplicantWithGoogleRequestSchema: yup.ObjectSchema<RegisterApplicantWithGoogleRequest> = BasicApplicantSchema.pick([
  "contact",
  "birthDate",
  "lastName",
  "firstName",
  "middleName",
],).shape({ googleToken: GoogleTokenSchema, email: yup.string().defined().email().nullable(), },);


export type RegisterApplicantHhToken = BasicHhToken & Pick<HhToken, "hhApplicantId">


export type RegisterApplicantWithHhByAuthCodeRequest = RegisterApplicantWithHhRequest & HhAuthorizationCodeRequest & {
  _authBy: HH_AUTHORIZATION_CODE
}
export type RegisterApplicantWithHhByHhTokenRequest = RegisterApplicantWithHhRequest & { hhToken: BasicHhToken } & {
  _authBy: HH_TOKEN
}

export const RegisterApplicantWithHhByAuthCodeRequestSchema: yup.ObjectSchema<RegisterApplicantWithHhByAuthCodeRequest> = RegisterApplicantWithHhRequestSchema.concat(
  HhAuthorizationCodeRequestSchema,
).shape({_authBy: yup.string().defined().oneOf([HH_AUTHORIZATION_CODE,] as const,),},);

export const RegisterApplicantWithHhByHhTokenRequestSchema: yup.ObjectSchema<RegisterApplicantWithHhByHhTokenRequest> = RegisterApplicantWithHhRequestSchema.shape({
  _authBy: yup.string().defined().oneOf([HH_TOKEN,] as const,),
  hhToken: BasicHhTokenSchema,
},);


export type AuthWithHhUserResponse = CreateAccessTokenResponse | AuthWithHhUserAccountResponse

export type AuthWithHhRequest = {
  role: APPLICANT;
} & HhAuthorizationCodeRequest

export const AuthWithHhRequestSchema: yup.ObjectSchema<AuthWithHhRequest> = HhAuthorizationCodeRequestSchema.shape({
  role: APPLICANT_SCHEMA,
},);
export { HH_AUTHORIZATION_CODE, HH_TOKEN, };
