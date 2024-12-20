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
import {
  BasicResumeExperience,
  CreateResumeExperienceRequest,
  CreateResumeExperienceRequestSchema,
  PatchResumeExperienceRequest,
  PatchResumeExperienceRequestSchema,
} from "./experience.dto";


@Route("api/v1/resumeExperience")
@Tags("Resume Experience")
export class ResumeExperienceController extends Controller {
  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateResumeExperienceRequest,
  ): Promise<BasicResumeExperience> {
    body = CreateResumeExperienceRequestSchema.validateSync(body);

    const resume = await prisma.resume.findUnique({
      where: {
        id: body.resumeId,
        ...(req.user.role === UserRole.APPLICANT && { applicantId: req.user.id }),
      },
    });

    if (!resume) throw new HttpError(404, "Resume not found");

    return prisma.resumeExperience.create({
      data: {
        ...body,
      },
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeExperience not found")
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchResumeExperienceRequest,
  ): Promise<void> {
    body = PatchResumeExperienceRequestSchema.validateSync(body);

    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const experience = await prisma.resumeExperience.findUnique({ where });
    if (!experience) throw new HttpError(404, "ResumeExperience not found");

    await prisma.resumeExperience.update({
      where,
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeExperience not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const experience = await prisma.resumeExperience.findUnique({ where });
    if (!experience) throw new HttpError(404, "ResumeExperience not found");

    await prisma.resumeExperience.delete({ where });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeExperience not found")
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<BasicResumeExperience> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const experience = await prisma.resumeExperience.findUnique({ where });
    if (!experience) throw new HttpError(404, "ResumeExperience not found");

    return experience;
  }
}
