import { Body, Controller, Request, Middlewares, Post, Query, Response, Route, Tags } from "tsoa";
import {
  CreateAccessTokenRequest,
  CreateAccessTokenResponse, CreateGuestAccessTokenRequest, GUEST_ROLE,
  RegisterApplicantRequest,
  RegisterEmployerRequest,
  UserRole,
} from "./auth.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { AuthService } from "./auth.service";
import { injectable } from "tsyringe";
import { DadataService } from "../../external/dadata/dadata.service"
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware"


@injectable()
@Route("api/v1/auth")
@Tags("Auth: вход и регистрация")
export class AuthController extends Controller {
  constructor(
    private readonly authService: AuthService,
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
      iat: Date.now(),
    });

    return { token };
  }

  @Post("guest/accessToken")
  public async createGuestAccessToken(
    @Body() body: CreateGuestAccessTokenRequest,
  ): Promise<CreateAccessTokenResponse> {
    CreateGuestAccessTokenRequest.schema.validateSync(body);

    const token = this.authService.createToken({
      id: body.email,
      role: GUEST_ROLE,
      iat: Date.now(),
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

    await prisma.applicant.create({
      data: {
        login: body.email,
        password: {
          create: {
            hash: await this.authService.generatePasswordHash(body.password),
          },
        },
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        contact: body.contact,
        email: body.email,
        birthDate: body.birthDate,
      },
    });
  }

  @Post("employer")
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "User with this email already exists"}>(409)
  public async registerEmployer(@Body() body: RegisterEmployerRequest): Promise<void> {
    RegisterEmployerRequest.schema.validateSync(body);

    const existingWithSameEmailEmployer = await prisma.employer.findUnique({ where: { email: body.email } });
    if(existingWithSameEmailEmployer) throw new HttpError(409, "User with this email already exists");

    await prisma.employer.create({
      data: {
        email: body.email,
        contact: body.contact,
        password: {
          create: {
            hash: await this.authService.generatePasswordHash(body.password),
          },
        },
        lastName: body.lastName,
        firstName: body.firstName,
        middleName: body.middleName,
        login: body.email,
        name: body.name,
      },
    });
  }
}
