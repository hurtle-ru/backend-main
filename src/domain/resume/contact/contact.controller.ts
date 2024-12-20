import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { BasicResumeContact, CreateResumeContactRequest, CreateResumeContactRequestSchema, PatchResumeContactRequest, PatchResumeContactRequestSchema } from "./contact.dto";


@Route("api/v1/resumeContacts")
@Tags("Resume Contact")
export class ResumeContactController extends Controller {
  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateResumeContactRequest,
  ): Promise<BasicResumeContact> {
    body = CreateResumeContactRequestSchema.validateSync(body);

    const resume = await prisma.resume.findUnique({
      where: {
        id: body.resumeId,
        ...(req.user.role === UserRole.APPLICANT && { applicantId: req.user.id }),
      },
    });

    if (!resume) throw new HttpError(404, "Resume not found");

    return prisma.resumeContact.create({
      data: {
        ...body,
      },
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeContact not found")
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchResumeContactRequest,
  ): Promise<void> {
    PatchResumeContactRequestSchema.validateSync(body);

    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const contact = await prisma.resumeContact.findUnique({ where });
    if (!contact) throw new HttpError(404, "ResumeContact not found");

    await prisma.resumeContact.update({
      where,
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeContact not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const contact = await prisma.resumeContact.findUnique({ where });
    if (!contact) throw new HttpError(404, "ResumeContact not found");

    await prisma.resumeContact.delete({ where });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeContact not found")
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<BasicResumeContact> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const contact = await prisma.resumeContact.findUnique({ where });
    if (!contact) throw new HttpError(404, "ResumeContact not found");

    return contact;
  }
}
