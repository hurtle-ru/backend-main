import { injectable } from "tsyringe";
import { Body, Controller, Get, Patch, Path, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { JwtModel, PUBLIC_SCOPE, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import {
  BasicGuestVacancyResponseResumeContact,
  PatchGuestVacancyResponseResumeContactRequest,
  PatchGuestVacancyResponseResumeContactRequestSchema,
} from "./contact.dto";
import { GuestVacancyResponseResumeContact } from "@prisma/client";

@injectable()
@Route("api/v1/guestVacancyResponseResumes/contacts")
@Tags("Guest Vacancy Response Resume Contact")
export class GuestVacancyResponseResumeContactController extends Controller {
  constructor() {
    super();
  }

  @Get("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponseResumeContact not found"}>(404)
  public async getById(
    @Request() req: JwtModel | { user: undefined },
    @Path() id: string,
    @Query() include?: ("response" | "contacts")[],
  ): Promise<GuestVacancyResponseResumeContact> {
    const where = { id };

    const guestVacancyResponseResumeContact = await prisma.guestVacancyResponseResumeContact.findUnique({
      where,
    });

    if (!guestVacancyResponseResumeContact) throw new HttpError(404, "GuestVacancyResponseResumeContact not found");
    return guestVacancyResponseResumeContact;
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponseResumeContact not found"}>(404)
  public async patchById(
    @Request() req: JwtModel | { user: undefined },
    @Path() id: string,
    @Body() body: PatchGuestVacancyResponseResumeContactRequest,
  ): Promise<BasicGuestVacancyResponseResumeContact> {
    body = PatchGuestVacancyResponseResumeContactRequestSchema.validateSync(body);

    const where = { id };

    const guestVacancyResponseResumeContact = await prisma.guestVacancyResponseResumeContact.findUnique({
      where,
    });

    if (!guestVacancyResponseResumeContact) throw new HttpError(404, "GuestVacancyResponseResumeContact not found");

    return prisma.guestVacancyResponseResumeContact.update({
      where: where,
      data: body,
    });
  }
}