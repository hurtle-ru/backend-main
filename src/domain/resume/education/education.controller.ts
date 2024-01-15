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
  Res,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
  TsoaResponse,
} from "tsoa";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/httpError";
import { prisma } from "../../../infrastructure/database/prismaClient";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { BasicResumeEducation, CreateResumeEducationRequest, PutResumeEducationRequest } from "./education.dto";


@Route("api/v1/resumeEducation")
@Tags("Resume Education")
export class ResumeEducationController extends Controller {
  @Post("")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateResumeEducationRequest,
  ): Promise<BasicResumeEducation> {
    const resume = await prisma.resume.findUnique({
      where: { id: body.resumeId, applicantId: req.user.id },
    });

    if(!resume) throw new HttpError(404, "Resume not found");

    return prisma.resumeEducation.create({
      data: {
        ...body,
      },
    });
  }

  @Put("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutResumeEducationRequest
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    await prisma.resumeEducation.update({
      where,
      data: body,
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutResumeEducationRequest>,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    await prisma.resumeEducation.update({
      where: { id: id },
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    await prisma.resumeEducation.delete({ where });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeEducation not found")
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string
  ): Promise<BasicResumeEducation> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const education = await prisma.resumeEducation.findUnique({ where });
    if (!education) throw new HttpError(404, "ResumeEducation not found");

    return education;
  }
}