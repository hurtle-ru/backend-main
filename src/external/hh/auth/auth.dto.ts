import * as yup from 'yup'
import { HhToken } from "@prisma/client";


export type BasicHhToken = Pick<
  HhToken,
  | "accessToken"
  | "refreshToken"
  | "expiresIn"
>;

export type HhAuthorizationCodeRequest = {
  authorizationCode: string,
}

export const HhAuthorizationCodeRequestSchema: yup.ObjectSchema<HhAuthorizationCodeRequest> = yup.object({
  authorizationCode: yup.string().defined().length(64)
})
