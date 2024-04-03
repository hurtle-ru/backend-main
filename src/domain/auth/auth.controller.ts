import { Body, Controller, Request, Example, Middlewares, Get, Post, Query, Response, Route, Tags } from "tsoa";
import {
  CreateAccessTokenRequest,
  CreateAccessTokenResponse, CreateGuestAccessTokenRequest, GUEST_ROLE, JwtModel,
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
  CreateGuestAccessTokenRequestSchema,
  RegisterEmployerRequestSchema,
} from "./auth.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { AuthService } from "./auth.service";
import { injectable } from "tsyringe";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware"
import { Request as ExpressRequest } from "express";
import { AuthWithGoogleRequest, AuthWithGoogleUserResponse } from "../../external/google/auth/auth.dto";
import { GoogleAuthService } from "../../external/google/auth/auth.service";
import { HhAuthService } from "../../external/hh/auth/auth.service";
import { HhApplicantService } from "../../external/hh/applicant/applicant.service";
import { BasicHhToken } from "../../external/hh/auth/auth.dto";
import { validateSyncByAtLeastOneSchema } from "../../infrastructure/validation/requests/utils.yup";


@injectable()
@Route("api/v1/auth")
@Tags("Auth: вход и регистрация")
export class AuthController extends Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly hhAuthService: HhAuthService,
    private readonly hhApplicantService: HhApplicantService,
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
    CreateGuestAccessTokenRequestSchema.validateSync(body);

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
    RegisterApplicantRequestSchema.validateSync(body);

    const existingApplicant = await prisma.applicant.findUnique({ where: { email: body.email } });
    if(existingApplicant) throw new HttpError(409, "User with this email already exists");

    await this.authService.registerApplicant(body);
  }

  @Post("employer")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "User with this email already exists"}>(409)
  public async registerEmployer(@Body() body: RegisterEmployerRequest): Promise<void> {
    RegisterEmployerRequestSchema.validateSync(body);

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
      googleToken = await this.googleAuthService.verifyGoogleToken(body.googleToken);
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
    RegisterApplicantWithGoogleRequestSchema.validateSync(body);

    let googleToken;
    try {
      googleToken = await this.googleAuthService.verifyGoogleToken(body.googleToken);
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

  @Get("HhAuthorizeUrl")
  @Example<string>("https://hh.ru/oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI")
  public async getHHAuthorizeUrl(): Promise<string> {
    return this.hhAuthService.getAuthorizeUrl();
  }

  @Post("withHh/applicant")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  @Response<HttpErrorBody & {"error": "User with this hh account already exists"}>(409)
  public async registerApplicantWithHh(
    @Body() body: RegisterApplicantWithHhByHhTokenRequest | RegisterApplicantWithHhByAuthCodeRequest,
  ): Promise<CreateAccessTokenResponse> {
    let hhToken: BasicHhToken;

    const { _authBy, ...bodyWithOutAuthBy } = body;

    validateSyncByAtLeastOneSchema(
      [
        RegisterApplicantWithHhByAuthCodeRequestSchema.omit(["_authBy"]),
        RegisterApplicantWithHhByHhTokenRequestSchema.omit(["_authBy"])
      ],
      bodyWithOutAuthBy,
    )

    if (body._authBy === HH_AUTHORIZATION_CODE) {
      hhToken = await this.hhAuthService.createToken(body.authorizationCode);
    }
    else if (body._authBy === HH_TOKEN) hhToken = body.hhToken;

    const hhApplicant = await this.hhApplicantService.getMeApplicant(hhToken!.accessToken);

    if (await prisma.hhToken.exists({ hhApplicantId: hhApplicant.id })) {
      throw new HttpError(409, "User with this hh account already exists")
    }

    const applicant = await this.authService.registerApplicantWithHh(body, {...hhToken!, hhApplicantId: hhApplicant.id });

    const accessToken = this.authService.createToken({
      id: applicant.id,
      role: UserRole.APPLICANT,
    });

    return { token: accessToken };
  }

  @Post("withHh")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  public async authWithHH(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: AuthWithHhRequest,
  ): Promise<AuthWithHhUserResponse> {
    AuthWithHhRequestSchema.validateSync(body)

    const hhToken = await this.hhAuthService.createToken(body.authorizationCode);
    const hhApplicant = await this.hhApplicantService.getMeApplicant(hhToken.accessToken);

    const applicantHhToken = await prisma.hhToken.findUnique({ where: { hhApplicantId: hhApplicant.id } });

    if ( applicantHhToken ) {
      const accessToken = this.authService.createToken({
        id: applicantHhToken.applicantId,
        role: UserRole.APPLICANT,
      });

      return { token: accessToken };
    }

    return {
      message: "Hh token is valid, but registration is required",
      hhToken,
      hhAccount: {
        firstName: hhApplicant.firstName,
        lastName: hhApplicant.lastName,
        middleName: hhApplicant.middleName,
        email: hhApplicant.email,
        phone: hhApplicant.phone,
      },
    };
  }
}
