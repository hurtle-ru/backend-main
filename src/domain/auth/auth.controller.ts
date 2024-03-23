import { Body, Controller, Request, Middlewares, Post, Query, Response, Route, Tags } from "tsoa";
import {
  CreateAccessTokenRequest,
  CreateAccessTokenResponse, CreateGuestAccessTokenRequest, GUEST_ROLE, JwtModel,
  RegisterApplicantRequest, RegisterApplicantWithGoogleRequest,
  RegisterEmployerRequest,
  UserRole,
} from "./auth.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { AuthService } from "./auth.service";
import { injectable } from "tsyringe";
import { DadataService } from "../../external/dadata/dadata.service"
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware"
import { application, Request as ExpressRequest } from "express";
import { AuthWithGoogleRequest, AuthWithGoogleUserResponse } from "../../external/oauth/oauth.dto";
import { OauthService } from "../../external/oauth/oauth.service";
import { oauthConfig } from "../../external/oauth/oauth.config";


@injectable()
@Route("api/v1/auth")
@Tags("Auth: вход и регистрация")
export class AuthController extends Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OauthService,
    private readonly dadataService: DadataService
  ) {
    super();
  }

  @Post("accessToken")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Invalid login or password"}>(401)
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
    }

    if (role === UserRole.APPLICANT) user = await prisma.applicant.findUnique(findQuery);
    if (role === UserRole.EMPLOYER) user = await prisma.employer.findUnique(findQuery);
    if (role === UserRole.MANAGER) user = await prisma.manager.findUnique(findQuery);

    if (!user || !(await this.authService.comparePasswords(password, user.password!.hash))) {
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
    CreateGuestAccessTokenRequest.schema.validateSync(body);

    const token = this.authService.createToken({
      id: body.email,
      role: GUEST_ROLE,
    });

    return { token };
  }

  @Post("applicant")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "User with this email already exists"}>(409)
  public async registerApplicant(@Body() body: RegisterApplicantRequest): Promise<void> {
    RegisterApplicantRequest.schema.validateSync(body);

    const existingApplicant = await prisma.applicant.findUnique({ where: { email: body.email } });
    if(existingApplicant) throw new HttpError(409, "User with this email already exists");

    await this.authService.registerApplicant(body);
  }

  @Post("employer")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "User with this email already exists"}>(409)
  public async registerEmployer(@Body() body: RegisterEmployerRequest): Promise<void> {
    RegisterEmployerRequest.schema.validateSync(body);

    const existingWithSameEmailEmployer = await prisma.employer.findUnique({ where: { email: body.email } });
    if(existingWithSameEmailEmployer) throw new HttpError(409, "User with this email already exists");

    await this.authService.registerEmployer(body);
  }

  @Post("withGoogle")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Invalid Google token"}>(401)
  public async authWithGoogle(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: AuthWithGoogleRequest,
  ): Promise<AuthWithGoogleUserResponse> {
    let googleToken;
    try {
      googleToken = await this.oauthService.verifyGoogleToken(body.googleToken);
    } catch(e) {
      throw new HttpError(401, "Invalid Google token");
    }

    const applicantByGoogleToken = await prisma.applicant.findUnique({ where: { googleTokenSub: googleToken.sub } });
    if(applicantByGoogleToken) {
      const accessToken = this.authService.createToken({
        id: applicantByGoogleToken.id,
        role: UserRole.APPLICANT,
      });

      return { token: accessToken };
    }

    const applicantByGoogleEmail = await prisma.applicant.findUnique({ where: { email: googleToken.email } });
    if(applicantByGoogleEmail) {
      await this.oauthService.linkAccountToGoogle(googleToken);

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
        email: googleToken.email!,
        name: googleToken.name,
        givenName: googleToken.given_name,
        familyName: googleToken.family_name,
        avatarUrl: googleToken.picture,
      },
    };
  }

  @Post("withGoogle/applicant")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Invalid Google token"}>(401)
  @Response<HttpErrorBody & {"error":
      | "User with this email already exists"
      | "User with this Google account already exists"
  }>(409)
  public async registerApplicantWithGoogle(
    @Body() body: RegisterApplicantWithGoogleRequest
  ): Promise<CreateAccessTokenResponse> {
    RegisterApplicantWithGoogleRequest.schema.validateSync(body);

    let googleToken;
    try {
      googleToken = await this.oauthService.verifyGoogleToken(body.googleToken);
    } catch(e) {
      throw new HttpError(401, "Invalid Google token");
    }

    const existingApplicantByEmail = await prisma.applicant.findUnique({ where: { email: googleToken.email! } });
    if(existingApplicantByEmail) throw new HttpError(409, "User with this email already exists");

    const existingApplicantByGoogleToken = await prisma.applicant.findUnique({ where: { googleTokenSub: googleToken.sub } });
    if(existingApplicantByGoogleToken) throw new HttpError(409, "User with this Google account already exists");

    const applicant = await this.authService.registerApplicantWithGoogle(body, googleToken);

    const accessToken = this.authService.createToken({
      id: applicant.id,
      role: UserRole.APPLICANT,
    });

    return { token: accessToken };
  }
}
