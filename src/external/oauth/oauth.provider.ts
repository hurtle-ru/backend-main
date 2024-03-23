import { oauthConfig } from "./oauth.config";
import { OAuth2Client } from "google-auth-library";


export const googleOauthClient = new OAuth2Client({
  clientId: oauthConfig.OAUTH_GOOGLE_CLIENT_ID,
  clientSecret: oauthConfig.OAUTH_GOOGLE_CLIENT_SECRET,
});