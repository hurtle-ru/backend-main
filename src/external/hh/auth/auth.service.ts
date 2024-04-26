import { singleton } from "tsyringe";
import axios, { AxiosError } from "axios";
import qs from "qs";
import { hhConfig } from "../hh.config";
import { HttpError } from "../../../infrastructure/error/http.error";
import { BasicHhToken } from "./auth.dto";
import { HhToken } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HhRefreshTokenNotExpired } from "./auth.error";




@singleton()
export class HhAuthService {
  constructor() {
  }

  async getAuthorizeUrl() {
    return `https://hh.ru/oauth/authorize?response_type=code&client_id=${hhConfig.HH_CLIENT_ID}&redirect_uri=${hhConfig.HH_REDIRECT_URI}`;
  }

  async createToken(code: string): Promise<BasicHhToken & { createdAt: Date }> {
    const params = {
      client_id: hhConfig.HH_CLIENT_ID,
      client_secret: hhConfig.HH_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: hhConfig.HH_REDIRECT_URI,
    };

    const response = await axios.post("https://api.hh.ru/token", qs.stringify(params), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      throw new HttpError(401, "Code is invalid");
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      createdAt: new Date(),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<BasicHhToken> {
    const params = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    };

    try {
      const response = await axios.post("https://api.hh.ru/token", qs.stringify(params), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (e: unknown) {
      if(!(e instanceof AxiosError)) throw e;

      if(e.response?.status === 400 && e.response.data?.error_description === "token not expired") {
        throw new HhRefreshTokenNotExpired("Auth token is not expired");
      }

      throw e;
    }
  }

  async refreshTokenAndSaveIfNeed(hhToken: HhToken): Promise<HhToken> {
    if(prisma.hhToken.isExpired(hhToken)) {
      let newToken;
      try {
        newToken = await this.refreshAccessToken(hhToken.refreshToken);
      } catch(e: unknown) {
        if(!(e instanceof HhRefreshTokenNotExpired)) throw e;

        return hhToken;
      }

      const newTokenData = {
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        expiresIn: newToken.expiresIn,
      }

      await prisma.hhToken.update({
        where: { applicantId: hhToken.applicantId },
        data: newTokenData,
      });

      return {...hhToken, ...newTokenData}
    }

  return hhToken
  }

}