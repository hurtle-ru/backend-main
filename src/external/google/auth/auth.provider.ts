import { googleAuthConfig } from "./auth.config";
import { OAuth2Client } from "google-auth-library";


export const googleAuthClient = new OAuth2Client({
  clientId: googleAuthConfig.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: googleAuthConfig.GOOGLE_OAUTH_CLIENT_SECRET,
});