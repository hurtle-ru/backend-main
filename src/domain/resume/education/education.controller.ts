import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import {
  BasicResumeEducation,
  CreateResumeEducationRequest,
  CreateResumeEducationRequestSchema,
  PatchResumeEducationRequest,
  PatchResumeEducationRequestSchema,
} from "./education.dto";


@Route("api/v1/resumeEducation")
@Tags("Resume Education")
export class ResumeEducationController extends Controller {
  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateResumeEducationRequest,
  ): Promise<BasicResumeEducation> {
    body = CreateResumeEducationRequestSchema.validateSync(body);

    const resume = await prisma.resume.findUnique({
      where: {
        id: body.resumeId,
        ...(req.user.role === UserRole.APPLICANT && { applicantId: req.user.id })
      },
    });

    if (!resume) throw new HttpError(404, "Resume not found");

    return prisma.resumeEducation.create({
      data: {
        ...body,
      },
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchResumeEducationRequest,
  ): Promise<void> {
    PatchResumeEducationRequestSchema.validateSync(body);

    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    await prisma.resumeEducation.update({
      where,
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    await prisma.resumeEducation.delete({ where });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<BasicResumeEducation> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    return education;
  }
}
