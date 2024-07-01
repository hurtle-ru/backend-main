import * as yup from "yup";
import { GazpromToken, Gender } from "@prisma/client";
import { DeepNullable } from "../../util/typescript.utils";


const WEEK = 3600 * 24 * 7;

export type BasicGazpromToken = Pick<
  GazpromToken,
  | "createdAt"
  | "accessToken"
  | "refreshToken"
  | "tokenType"
  | "expiresIn"
>;

export const BasicGazpromTokenSchema: yup.ObjectSchema<BasicGazpromToken> = yup.object({
  createdAt: yup.date().defined(),
  accessToken: yup.string().trim().min(1).defined(),
  refreshToken: yup.string().trim().min(1).defined(),
  tokenType: yup.string().trim().max(64).defined(),
  expiresIn: yup.number().min(0).max(2 * WEEK).defined(),
});

export const GAZPROM_TOKEN = "GAZPROM_TOKEN"
export type GAZPROM_TOKEN = "GAZPROM_TOKEN"

export const GAZPROM_AUTHORIZATION_CODE = "GAZPROM_AUTHORIZATION_CODE"
export type GAZPROM_AUTHORIZATION_CODE = "GAZPROM_AUTHORIZATION_CODE"

export type GazpromAuthorizationCodeRequest = {
  authorizationCode: string,
}

export const GazpromAuthorizationCodeRequestSchema: yup.ObjectSchema<GazpromAuthorizationCodeRequest> = yup.object({
  authorizationCode: yup.string().defined().min(1),
});

export type GazpromErrorResponse = { error: string }

export type CreateGazpromTokenResponse = {
  access_token: string,
  token_type: string,
  expires_in: number,
  refresh_token: string,
  id_token: string,
  scope: string,
} | GazpromErrorResponse

export type AuthWithGazpromUserAccountResponse = {
  message: "Gazprom token is valid, but registration is required",
  gazpromToken: BasicGazpromToken,
  gazpromAccount: Omit<GazpromUserInfo, "openid">,
}

export type RefreshGazpromTokenResponse = CreateGazpromTokenResponse

export type GazpromUserInfoResponse = {
  sub: string,
  phone?: string,
  first_name?: string,
  last_name?: string,
  nickname?: string,
  profile?: string,
  city?: string,
  gender?: string,
  birthdate?: string,
  age?: string,
  email?: string,
}

export type GetGazpromUserInfoResponse = GazpromUserInfoResponse | GazpromErrorResponse

export type GazpromUserInfo = {
  openid: string,
  phone: string | null,
  firstName: string | null,
  lastName: string | null,
  nickname: string | null,
  middleName: string | null,
  city: string | null,
  gender: Gender | null,
  birthDate: string | null,
  age: string | null,
  email: string | null,
}
