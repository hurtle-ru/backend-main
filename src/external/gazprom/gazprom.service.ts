import { singleton } from "tsyringe";
import axios from "axios";
import qs from "qs";
import { gazpromConfig } from "./gazprom.config";
import { randomUUID } from "crypto";
import urlJoin from "url-join";
import { HttpError } from "../../infrastructure/error/http.error";
import { BasicGazpromToken, CreateGazpromTokenResponse, GazpromUserInfo, GetGazpromUserInfoResponse, RefreshGazpromTokenResponse } from "./gazprom.dto";
import { logger } from "../../infrastructure/logger/logger";
import { GazpromToken } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { join } from "lodash";
import { GazpromMappingService } from "./gazprom.mapper";


@singleton()
export class GazpromService {
  // private readonly BASE_URL = "https://auth.gid.ru/"
  private readonly BASE_URL = "https://preprod.gid-auth.ru/";
  private readonly SCOPES = [
    "openid", "phone", "first_name", "last_name", "profile", "city", "gender", "birthdate", "email", "email_confirmed", "offline_access",
  ];

  private readonly CLIENT_AUTH = this.makeClientAuth();

  constructor(
    private readonly mappingService: GazpromMappingService,
  ) {}

  buildAuthorizeUrl(): string {
    const params = qs.stringify({
      response_type: "code",
      client_id: gazpromConfig.GAZPROM_CLIENT_ID,
      scope: this.SCOPES.join(" "),
      redirect_uri: gazpromConfig.GAZPROM_REDIRECT_URI,
      state: randomUUID(),
      max_age: 604800, // 1 WEEK
    });

    return urlJoin(this.BASE_URL, `oauth2/auth/?${params}`);
  }

  async getUserInfo({ accessToken, tokenType }: BasicGazpromToken): Promise<GazpromUserInfo> {
    const response = await axios.get<GetGazpromUserInfoResponse>(
      urlJoin(this.BASE_URL, "/userinfo"),
      {
        headers: {
          "Authorization": join([tokenType, accessToken], " "),
        },
        validateStatus: () => true,
      },
    );

    if ("error" in response.data) {
      logger.error({ err: response.data.error }, "Get Gazprom user info error: ");
      throw new HttpError(401, "Code is invalid");
    }

    const user = this.mappingService.mapUserInfo(response.data);

    return user;
  }

  async createToken(code: string): Promise<BasicGazpromToken> {
    const body = {
      code,
      client_id: gazpromConfig.GAZPROM_CLIENT_ID,
      client_secret: gazpromConfig.GAZPROM_CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: gazpromConfig.GAZPROM_REDIRECT_URI,
    };
    const response = await axios.post<CreateGazpromTokenResponse>(
      urlJoin(this.BASE_URL, "oauth2/token"),
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        validateStatus: () => true,
      },
    );

    if ("error" in response.data) {
      logger.error({ err: response.data.error }, "Create gazprom access token error: ");
      throw new HttpError(401, "Code is invalid");
    }

    return {
      createdAt: new Date(),
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: this.capitalizeTokenType(response.data.token_type),
    };
  }

  async refreshTokenAndSaveIfNeed(token: GazpromToken): Promise<GazpromToken> {
    if (prisma.gazpromToken.isExpired(token)) {
      const newToken = await this.refreshAccessToken(token.refreshToken);

      const newTokenData = {
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        expiresIn: newToken.expiresIn,
      };

      await prisma.gazpromToken.update({
        where: { applicantId: token.applicantId },
        data: newTokenData,
      });

      return { ...token, ...newTokenData };
    }

    return token;
  }

  private async refreshAccessToken(refreshToken: string): Promise<BasicGazpromToken> {
    const body = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: gazpromConfig.GAZPROM_CLIENT_ID,
      client_secret: gazpromConfig.GAZPROM_CLIENT_SECRET,
      scope: this.SCOPES.join(" "),
    };

    const response = await axios.post<RefreshGazpromTokenResponse>(
      urlJoin(this.BASE_URL, "oauth2/token"),
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        validateStatus: () => true,
      },
    );

    if ("error" in response.data) {
      logger.error({ err: response.data.error }, "Refresh gazprom token error: ");
      throw new HttpError(401, "Can not refresh token");
    }

    return {
      createdAt: new Date(),
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
    };
  }

  private makeClientAuth(): string {
    return btoa(gazpromConfig.GAZPROM_CLIENT_ID + ":" + gazpromConfig.GAZPROM_CLIENT_SECRET);
  }

  private capitalizeTokenType(token: string): string {
    if (token === "bearer") return "Bearer";

    if (token.length === 0) {
      return token;
    }
    return token.charAt(0).toUpperCase() + token.slice(1);
  }
}