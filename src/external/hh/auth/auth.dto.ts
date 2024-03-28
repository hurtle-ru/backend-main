import { HhToken } from "@prisma/client";

export type BasicHhToken = Pick<
  HhToken,
  | "accessToken"
  | "refreshToken"
  | "expiresIn"
>;

export type HHAuthorizationCodeRequest = {
  authorizationCode: string,
}
