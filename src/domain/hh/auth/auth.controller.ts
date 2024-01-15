import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { HhAuthService } from "../../../external/hh/auth/auth.service";
import { CreateAccessTokenRequest, CreateAccessTokenResponse, JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpErrorBody } from "../../../infrastructure/error/httpError";
import { CreateHhAccessTokenResponse } from "./auth.dto";
import { prisma } from "../../../infrastructure/database/prismaClient";
import { HhApplicantService } from "../../../external/hh/applicant/applicant.service";


@injectable()
@Route("api/v1/hh/auth")
@Tags("hh.ru Auth")
export class HhAuthController extends Controller {
  constructor(private readonly hhAuthService: HhAuthService,
              private readonly hhApplicantService: HhApplicantService,
              ) {
    super();
  }

  @Get("authorizeUrl")
  @Example<string>("https://hh.ru/oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI")
  @Security("jwt", [UserRole.APPLICANT])
  async getAuthorizeUrl(): Promise<string> {
    return this.hhAuthService.getAuthorizeUrl();
  }

  @Put("me/authorizationCode")
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  @Security("jwt", [UserRole.APPLICANT])
  public async putMeAuthorizationCode(
    @Request() req: JwtModel,
    @Body() authorizationCode: string,
  ): Promise<void> {
    const hhToken = await this.hhAuthService.createToken(authorizationCode);
    const hhApplicant = await this.hhApplicantService.getMeApplicant(hhToken.accessToken);

    await prisma.hhToken.create({
      data: {
        applicantId: req.user.id,
        hhApplicantId: hhApplicant.id,
        accessToken: hhToken.accessToken,
        refreshToken: hhToken.refreshToken,
        expiresIn: hhToken.expiresIn,
      },
    });
  }
}