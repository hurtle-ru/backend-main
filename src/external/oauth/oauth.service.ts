import { injectable, singleton } from "tsyringe";
import { oauthConfig } from "./oauth.config";
import { googleOauthClient } from "./oauth.provider";
import { TokenPayload } from "google-auth-library/build/src/auth/loginticket";
import { prisma } from "../../infrastructure/database/prisma.provider";


@injectable()
@singleton()
export class OauthService {
  constructor() {}

  async verifyGoogleToken(token: string): Promise<TokenPayload> {
    const ticket = await googleOauthClient.verifyIdToken({
      idToken: token,
      audience: oauthConfig.OAUTH_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if(!payload) throw new Error("Unable to verify Google token: payload is undefined");

    return payload;
  }

  async linkAccountToGoogle(googleToken: TokenPayload): Promise<void> {
    await prisma.applicant.update({
      where: {
        email: googleToken.email,
      },
      data: {
        googleTokenSub: googleToken.sub,
      },
    });
  }
}
