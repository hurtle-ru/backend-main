import { injectable } from "tsyringe";
import { Body, Controller, Get, Patch, Path, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { JwtModel, PUBLIC_SCOPE, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { prisma } from "../../infrastructure/database/prisma.provider";
import {
  BasicGuestVacancyResponseResume,
  PatchGuestVacancyResponseResumeRequest,
  PatchGuestVacancyResponseResumeRequestSchema,
} from "./guest-response-resume.dto";
import { GetGuestVacancyResponseResumeResponse } from "./guest-response-resume.dto";


@injectable()
@Route("api/v1/guestVacancyResponseResumes")
@Tags("Guest Vacancy Response Resume")
export class GuestVacancyResponseResumeController extends Controller {
  constructor() {
    super();
  }

  @Get("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponseResume not found"}>(404)
  public async getById(
    @Request() req: JwtModel | { user: undefined },
    @Path() id: string,
    @Query() include?: ("response" | "contacts")[],
  ): Promise<GetGuestVacancyResponseResumeResponse> {
    const where = { id };

    const guestVacancyResponseResume = await prisma.guestVacancyResponseResume.findUnique({
      where,
      include: {
        response: include?.includes("response"),
        contacts: include?.includes("contacts"),
      },
    });

    if (!guestVacancyResponseResume) throw new HttpError(404, "GuestVacancyResponseResume not found");
    return guestVacancyResponseResume;
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponseResume not found"}>(404)
  public async patchById(
    @Request() req: JwtModel | { user: undefined },
    @Path() id: string,
    @Body() body: PatchGuestVacancyResponseResumeRequest,
  ): Promise<BasicGuestVacancyResponseResume> {
    body = PatchGuestVacancyResponseResumeRequestSchema.validateSync(body);

    const where = { id };

    const guestVacancyResponseResume = await prisma.guestVacancyResponseResume.findUnique({
      where,
    });

    if (!guestVacancyResponseResume) throw new HttpError(404, "GuestVacancyResponseResume not found");

    return prisma.guestVacancyResponseResume.update({
      where: where,
      data: body,
    });
  }
}