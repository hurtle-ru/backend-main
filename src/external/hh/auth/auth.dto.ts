import * as yup from 'yup'
import { HhToken } from "@prisma/client";
import { CreateAccessTokenResponse, RegisterApplicantWithHhRequest } from '../../../domain/auth/auth.dto';


const WEEK = 3600 * 24 * 7

export type HH_AUTHORIZATION_CODE = "HH_AUTHORIZATION_CODE"
export const HH_AUTHORIZATION_CODE = "HH_AUTHORIZATION_CODE"

export type HH_TOKEN = "HH_TOKEN"
export const HH_TOKEN = "HH_TOKEN"

export type BasicHhToken = Pick<
  HhToken,
  | "accessToken"
  | "refreshToken"
  | "expiresIn"
>;

export const BasicHhTokenSchema: yup.ObjectSchema<BasicHhToken> = yup.object({
  accessToken: yup.string().trim().length(64).defined(),
  refreshToken: yup.string().trim().length(64).defined(),
  expiresIn: yup.number().min(0).max(2 * WEEK).defined(),
  createdAt: yup.number().min(0).max(2 * WEEK).defined(),
})

export type AuthWithHhUserAccountResponse = {
  message: "Hh token is valid, but registration is required",
  hhToken: BasicHhToken,
  hhAccount: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
    email?: string | null;
    phone?: string | null;
  }
}

export type HhAuthorizationCodeRequest = {
  authorizationCode: string,
}

export const HhAuthorizationCodeRequestSchema: yup.ObjectSchema<HhAuthorizationCodeRequest> = yup.object({
  authorizationCode: yup.string().defined().length(64),
})

