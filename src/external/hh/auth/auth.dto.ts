import * as yup from 'yup'
import { HhToken } from "@prisma/client";


const WEEK = 3600 * 24 * 7


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
})

export type HhAuthorizationCodeRequest = {
  authorizationCode: string,
}

export const HhAuthorizationCodeRequestSchema: yup.ObjectSchema<HhAuthorizationCodeRequest> = yup.object({
  authorizationCode: yup.string().defined().length(64)
})
