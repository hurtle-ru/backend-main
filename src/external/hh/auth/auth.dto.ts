import { HhToken } from "@prisma/client";

export type BasicHhToken = Pick<
  HhToken,
  | "accessToken"
  | "refreshToken"
  | "expiresIn"
>;