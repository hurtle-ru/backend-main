import * as yup from "yup";
import { CreateAccessTokenResponse } from "../../../domain/auth/auth.dto";

export const GoogleTokenSchema = yup.string().trim().min(1).defined();

export type AuthWithGoogleRequest = {
  googleToken: string;
  role: "APPLICANT";
}

export type AuthWithGoogleUserResponse = CreateAccessTokenResponse | {
  message: "Google token is valid, but registration is required",
  googleAccount: {
    isEmailVerified?: boolean,
    email: string | undefined,
    name?: string,
    givenName?: string,
    familyName?: string,
    avatarUrl?: string,
  }
}