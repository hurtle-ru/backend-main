import { CreateAccessTokenResponse } from "../../domain/auth/auth.dto";


export type AuthWithGoogleRequest = {
  googleToken: string;
  role: "APPLICANT";
}

export type AuthWithGoogleUserResponse = CreateAccessTokenResponse | {
  message: "Google token is valid, but registration is required",
  googleAccount: {
    isEmailVerified?: boolean,
    email: string,
    name?: string,
    givenName?: string,
    familyName?: string,
    avatarUrl?: string,
  }
}