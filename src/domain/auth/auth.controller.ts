import { Body, Controller, Request, Example, Middlewares, Get, Post, Query, Response, Route, Tags } from "tsoa";
import {
  CreateAccessTokenRequest,
  CreateAccessTokenResponse, JwtModel,
  RegisterApplicantRequest, RegisterApplicantWithGoogleRequest,
  RegisterEmployerRequest,
  UserRole,
  RegisterApplicantWithHhByAuthCodeRequest,
  RegisterApplicantWithHhByHhTokenRequest,
  RegisterApplicantWithHhByAuthCodeRequestSchema,
  RegisterApplicantWithHhByHhTokenRequestSchema,
  AuthWithHhRequest,
  AuthWithHhRequestSchema,
  AuthWithHhUserResponse,
  HH_AUTHORIZATION_CODE,
  HH_TOKEN,
  RegisterApplicantWithGoogleRequestSchema,
  RegisterApplicantRequestSchema,
  RegisterEmployerRequestSchema,
  AuthWithEmailCodeRequest,
  AuthGetEmailCodeRequest,
  AuthGetEmailCodeRequestSchema,
  AuthWithEmailCodeRequestSchema, CreateGuestAccessTokenRequest, CreateGuestAccessTokenRequestSchema, GUEST_ROLE, RegisterApplicantWithGazpromTokenRequest, RegisterApplicantWithGazpromCodeRequest, RegisterApplicantWithGazpromCodeRequestSchema, RegisterApplicantWithGazpromTokenRequestSchema, AuthWithGazpromRequest, AuthWithGazpromRequestSchema,
} from "./auth.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { AuthService } from "./auth.service";
import { injectable } from "tsyringe";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware";
import { Request as ExpressRequest } from "express";
import { AuthWithGoogleRequest, AuthWithGoogleUserResponse } from "../../external/google/auth/auth.dto";
import { GoogleAuthService } from "../../external/google/auth/auth.service";
import { HhAuthService } from "../../external/hh/auth/auth.service";
import { HhApplicantService } from "../../external/hh/applicant/applicant.service";
import { BasicHhToken } from "../../external/hh/auth/auth.dto";
import { validateSyncByAtLeastOneSchema } from "../../infrastructure/validation/requests/utils.yup";

import { logger } from "../../infrastructure/logger/logger";
import { GazpromService } from "../../external/gazprom/gazprom.service";
import { BasicGazpromToken, GAZPROM_AUTHORIZATION_CODE, GAZPROM_TOKEN } from "../../external/gazprom/gazprom.dto";


@injectable()
@Route("api/v1/auth")
@Tags("Auth: вход и регистрация")
export class AuthController extends Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly hhAuthService: HhAuthService,
    private readonly gazpromService: GazpromService,
    private readonly hhApplicantService: HhApplicantService,
  ) {
    super();
  }

  @Post("accessToken")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error":
      | "Invalid login or password"
      | "User does not have a password"
  }>(401)
  public async createAccessToken(
    @Body() body: CreateAccessTokenRequest,
    @Query() role: UserRole,
  ): Promise<CreateAccessTokenResponse> {
    const { login, password } = body;

    let user: { id: string, password: { hash: string } | null } | null = null;
    const findQuery = {
      where: { login },
      select: {
        id: true,
        password: {
          select: {
            hash: true,
          },
        },
      },
    };

    if (role === UserRole.APPLICANT) user = await prisma.applicant.findUnique(findQuery);
    if (role === UserRole.EMPLOYER) user = await prisma.employer.findUnique(findQuery);
    if (role === UserRole.MANAGER) user = await prisma.manager.findUnique(findQuery);

    if (user && !user.password) {
      throw new HttpError(401, "User does not have password");
    }

    if (!user || !(await this.authService.comparePasswords(password, user.password!.hash.trim()))) {
      throw new HttpError(401, "Invalid login or password");
    }

    const token = this.authService.createToken({
      id: user!.id,
      role: role,
    });

    return { token };
  }

  @Post("guest/accessToken")
  public async createGuestAccessToken(
    @Request() req: ExpressRequest,
    @Body() body: CreateGuestAccessTokenRequest,
  ): Promise<CreateAccessTokenResponse> {
    body = CreateGuestAccessTokenRequestSchema.validateSync(body);

    const token = this.authService.createToken({
      id: body.email,
      role: GUEST_ROLE,
    });

    return { token };
  }

  @Post("applicant")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "User with this email already exists"}>(409)
  public async registerApplicant(@Body() body: RegisterApplicantRequest): Promise<void> {
    body = RegisterApplicantRequestSchema.validateSync(body);

    const existingApplicant = await prisma.applicant.findUnique({ where: { email: body.email } });
    if (existingApplicant) throw new HttpError(409, "User with this email already exists");

    await this.authService.registerApplicant(body);
  }

  @Post("employer")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "User with this email already exists"}>(409)
  public async registerEmployer(@Body() body: RegisterEmployerRequest): Promise<void> {
    body = RegisterEmployerRequestSchema.validateSync(body);

    const existingWithSameEmailEmployer = await prisma.employer.exists({ email: body.email });
    if (existingWithSameEmailEmployer) throw new HttpError(409, "User with this email already exists");

    await this.authService.registerEmployer(body);
  }

  @Post("withGoogle")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Invalid Google token"}>(401)
  public async authWithGoogle(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: AuthWithGoogleRequest,
  ): Promise<AuthWithGoogleUserResponse> {
    let googleToken;
    try {
      googleToken = await this.googleAuthService.verifyGoogleToken(body.googleToken);
    } catch (e) {
      throw new HttpError(401, "Invalid Google token");
    }

    const applicantByGoogleToken = await prisma.applicant.findUnique({ where: { googleTokenSub: googleToken.sub } });
    if (applicantByGoogleToken) {
      const accessToken = this.authService.createToken({
        id: applicantByGoogleToken.id,
        role: UserRole.APPLICANT,
      });

      return { token: accessToken };
    }

    const applicantByGoogleEmail = await prisma.applicant.findUnique({ where: { email: googleToken.email } });
    if (applicantByGoogleEmail) {
      await this.googleAuthService.linkAccountToGoogle(googleToken);

      const accessToken = this.authService.createToken({
        id: applicantByGoogleEmail.id,
        role: UserRole.APPLICANT,
      });

      return { token: accessToken };
    }

    return {
      message: "Google token is valid, but registration is required",
      googleAccount: {
        isEmailVerified: googleToken.email_verified,
        email: googleToken.email,
        name: googleToken.name,
        givenName: googleToken.given_name,
        familyName: googleToken.family_name,
        avatarUrl: googleToken.picture,
      },
    };
  }

  @Post("withGoogle/applicant")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Invalid Google token"}>(401)
  @Response<HttpErrorBody & {"error":
      | "User with this email already exists"
      | "User with this Google account already exists"
      | "Need verified google email or provide it"
  }>(409)
  public async registerApplicantWithGoogle(
    @Body() body: RegisterApplicantWithGoogleRequest,
  ): Promise<CreateAccessTokenResponse> {
    body = RegisterApplicantWithGoogleRequestSchema.validateSync(body);

    let googleToken;
    try {
      googleToken = await this.googleAuthService.verifyGoogleToken(body.googleToken);
    } catch (e) {
      throw new HttpError(401, "Invalid Google token");
    }

    const email = (googleToken.email && googleToken.email_verified) ? googleToken.email : body.email;
    if (!email) throw new HttpError(409, "Need verified google email or provide it");

    const existingApplicantByEmail = await prisma.applicant.exists({ email });
    if (existingApplicantByEmail) throw new HttpError(409, "User with this email already exists");

    const existingApplicantByGoogleToken = await prisma.applicant.exists({ googleTokenSub: googleToken.sub });
    if (existingApplicantByGoogleToken) throw new HttpError(409, "User with this Google account already exists");

    const applicant = await this.authService.registerApplicantWithGoogle(body, googleToken, email);

    const accessToken = this.authService.createToken({
      id: applicant.id,
      role: UserRole.APPLICANT,
    });

    return { token: accessToken };
  }

  @Get("HhAuthorizeUrl")
  @Example<string>("https://hh.ru/oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI")
  public async getHHAuthorizeUrl(): Promise<string> {
    return this.hhAuthService.getAuthorizeUrl();
  }

  @Post("withHh/applicant")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  @Response<HttpErrorBody & {"error":
    | "User with this hh account already exists"
    | "User with this email already exists"
  }>(409)
  public async registerApplicantWithHh(
    @Body() body: RegisterApplicantWithHhByHhTokenRequest | RegisterApplicantWithHhByAuthCodeRequest,
  ): Promise<CreateAccessTokenResponse> {
    let hhToken: BasicHhToken;

    const { _authBy, ...bodyWithOutAuthBy } = body;

    const bodyData = validateSyncByAtLeastOneSchema(
      [
        RegisterApplicantWithHhByHhTokenRequestSchema.omit(["_authBy"]),
        RegisterApplicantWithHhByAuthCodeRequestSchema.omit(["_authBy"]),
      ],
      bodyWithOutAuthBy,
    );

    const existingApplicant = await prisma.applicant.exists({ email: bodyData.email });
    if (existingApplicant) throw new HttpError(409, "User with this email already exists");

    if (body._authBy === HH_AUTHORIZATION_CODE) {
      hhToken = await this.hhAuthService.createToken(body.authorizationCode);
    } else if (body._authBy === HH_TOKEN) hhToken = body.hhToken;

    const hhApplicant = await this.hhApplicantService.getMeApplicant(hhToken!.accessToken);

    if (await prisma.hhToken.exists({ hhApplicantId: hhApplicant.id })) {
      throw new HttpError(409, "User with this hh account already exists");
    }

    const applicant = await this.authService.registerApplicantWithHh(bodyData, { ...hhToken!, hhApplicantId: hhApplicant.id });

    const accessToken = this.authService.createToken({
      id: applicant.id,
      role: UserRole.APPLICANT,
    });

    return { token: accessToken };
  }

  @Post("withHh")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  public async authWithHH(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: AuthWithHhRequest,
  ): Promise<AuthWithHhUserResponse> {
    body = AuthWithHhRequestSchema.validateSync(body);

    const newHhToken = await this.hhAuthService.createToken(body.authorizationCode);
    const hhApplicant = await this.hhApplicantService.getMeApplicant(newHhToken.accessToken);
    let currentApplicantHhToken = await prisma.hhToken.findUnique({ where: { hhApplicantId: hhApplicant.id } });

    if (currentApplicantHhToken) {
      currentApplicantHhToken = await prisma.hhToken.update({
        where: {
          applicantId: currentApplicantHhToken.applicantId,
        },
        data: {
          ...newHhToken,
        },
      });

      const accessToken = this.authService.createToken({
        id: currentApplicantHhToken.applicantId,
        role: UserRole.APPLICANT,
      });

      return { token: accessToken };
    }

    if (hhApplicant.email) {
      const applicantByEmail = await prisma.applicant.findUnique({ where: { email: hhApplicant.email } });

      if (applicantByEmail) {
        await prisma.hhToken.create({
          data: {
            ...newHhToken,
            applicant: { connect: { id: applicantByEmail.id } },
            hhApplicantId: hhApplicant.id,
          },
        });

        const accessToken = this.authService.createToken({
          id: applicantByEmail.id,
          role: UserRole.APPLICANT,
        });

        return { token: accessToken };
      }
    }

    return {
      message: "Hh token is valid, but registration is required",
      hhToken: newHhToken,
      hhAccount: {
        firstName: hhApplicant.firstName,
        lastName: hhApplicant.lastName,
        middleName: hhApplicant.middleName,
        email: hhApplicant.email,
        phone: hhApplicant.phone,
      },
    };
  }

  @Get("GazpromAuthorizeUrl")
  @Example<string>("https://auth.gid.ru/oauth2/auth/?response_type=code&client_id=CLIENT_ID&scope=client&redirect_uri=REDIRECT_URI&state=STATE&max_age=604800")
  public async getGazpromAuthorizeUrl(): Promise<string> {
    return this.gazpromService.buildAuthorizeUrl();
  }

  @Post("withGazprom/applicant")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error":
    | "User with this gazprom account already exists"
    | "User with this email already exists"
  }>(409)
  public async registerApplicantWithGazprom(
    @Body() body: RegisterApplicantWithGazpromTokenRequest | RegisterApplicantWithGazpromCodeRequest,
  ): Promise<CreateAccessTokenResponse> {
    let gazpromToken: BasicGazpromToken;

    const { _authBy, ...bodyWithOutAuthBy } = body;

    const bodyData = validateSyncByAtLeastOneSchema(
      [
        RegisterApplicantWithGazpromCodeRequestSchema.omit(["_authBy"]),
        RegisterApplicantWithGazpromTokenRequestSchema.omit(["_authBy"]),
      ],
      bodyWithOutAuthBy,
    );

    const existingApplicant = await prisma.applicant.exists({ email: bodyData.email });
    if (existingApplicant) throw new HttpError(409, "User with this email already exists");

    if (body._authBy === GAZPROM_AUTHORIZATION_CODE) {
      gazpromToken = await this.gazpromService.createToken(body.authorizationCode);
    } else if (body._authBy === GAZPROM_TOKEN) gazpromToken = body.gazpromToken;

    const gazpromUser = await this.gazpromService.getUserInfo(gazpromToken!);

    if (await prisma.gazpromToken.exists({ gazpromUserId: gazpromUser.openid })) {
      throw new HttpError(409, "User with this gazprom account already exists");
    }

    const applicant = await this.authService.registerApplicantWithGazprom(
      {...bodyData, openid: gazpromUser.openid},
      gazpromToken!
    );

    const accessToken = this.authService.createToken({
      id: applicant.id,
      role: UserRole.APPLICANT,
    });

    return { token: accessToken };
  }

  @Post("withGazprom")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  public async authWithGazprom(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: AuthWithGazpromRequest,
  ): Promise<AuthWithGazpromResponse> {
    body = AuthWithGazpromRequestSchema.validateSync(body);

    const newToken = await this.gazpromService.createToken(body.authorizationCode);
    const gazpromUser = await this.gazpromService.getUserInfo(newToken);
    let currentToken = await prisma.gazpromToken.findUnique({ where: { gazpromUserId: gazpromUser.openid } });

    if (currentToken) {
      currentToken = await prisma.gazpromToken.update({
        where: {
          applicantId: currentToken.applicantId,
        },
        data: {
          ...newToken,
        },
      });

      const accessToken = this.authService.createToken({
        id: currentToken.applicantId,
        role: UserRole.APPLICANT,
      });

      return { token: accessToken };
    }

    if (gazpromUser.email) {
      const applicantByEmail = await prisma.applicant.findUnique({ where: { email: gazpromUser.email } });

      if (applicantByEmail) {
        await prisma.gazpromToken.create({
          data: {
            ...newToken,
            applicant: { connect: { id: applicantByEmail.id } },
            gazpromUserId: gazpromUser.openid,
          },
        });

        const accessToken = this.authService.createToken({
          id: applicantByEmail.id,
          role: UserRole.APPLICANT,
        });

        return { token: accessToken };
      }
    }

    let { openid, ...gazpromUserRest } = gazpromUser

    return {
      message: "Gazprom token is valid, but registration is required",
      gazpromToken: newToken,
      gazpromAccount: gazpromUser,
    };
  }

  @Post("getEmailCode")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "User with provided credentials not found"}>(404)
  public async authGetEmailCode(
    @Request() req: ExpressRequest,
    @Body() body: AuthGetEmailCodeRequest,
  ): Promise<void> {
    body = AuthGetEmailCodeRequestSchema.validateSync(body);

    const user = await {
      "APPLICANT": prisma.applicant.findUnique({ where: { email: body.email } }),
      "EMPLOYER": prisma.employer.findUnique({ where: { email: body.email } }),
    }[body.role];

    if (!user) throw new HttpError(404, "User with provided credentials not found");

    await this.authService.sendAuthByEmailCodeRequest(body.role, body.email, user.firstName);
  }

  @Post("withEmailCode")
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Invalid provided credentials or code"}>(401)
  public async authWithEmailCode(
    @Request() req: ExpressRequest,
    @Body() body: AuthWithEmailCodeRequest,
  ): Promise<CreateAccessTokenResponse> {
    body = AuthWithEmailCodeRequestSchema.validateSync(body);

    try {
      await prisma.authByEmailCode.delete({
        where: {
          code: body.code,
          email: body.email,
          role: body.role,
        },
      });

      const user = await {
        "APPLICANT":
          prisma.applicant.update({
            where: {
              email: body.email,
            },
            data: {
              isEmailConfirmed: true,
            },
          }),
        "EMPLOYER":
          prisma.employer.update({
            where: {
              email: body.email,
            },
            data: {
              isEmailConfirmed: true,
            },
          }),
      }[body.role];

      return {
        token: this.authService.createToken({
          role: {
            "APPLICANT": UserRole.APPLICANT,
            "EMPLOYER": UserRole.EMPLOYER,
          }[body.role],
          id: user!.id,
        }),
      };
    } catch (error) {
      logger.error(error);
      throw new HttpError(401, "Invalid provided credentials or code");
    }
  }
}
