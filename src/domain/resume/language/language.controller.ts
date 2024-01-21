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
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { BasicResumeLanguage, CreateResumeLanguageRequest, PutResumeLanguageRequest } from "./language.dto";


@Route("api/v1/resumeLanguages")
@Tags("Resume Language")
export class ResumeLanguageController extends Controller {
  @Post("")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateResumeLanguageRequest,
  ): Promise<BasicResumeLanguage> {
    const resume = await prisma.resume.findUnique({
      where: { id: body.resumeId, applicantId: req.user.id },
    });

    if(!resume) throw new HttpError(404, "Resume not found");

    return prisma.resumeLanguage.create({
      data: {
        ...body,
      },
    });
  }

  @Put("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeLanguage not found")
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutResumeLanguageRequest
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const language = await prisma.resumeLanguage.findUnique({ where });
    if (!language) throw new HttpError(404, "ResumeLanguage not found");

    await prisma.resumeLanguage.update({
      where,
      data: body,
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeLanguage not found")
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutResumeLanguageRequest>,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const language = await prisma.resumeLanguage.findUnique({ where });
    if (!language) throw new HttpError(404, "ResumeLanguage not found");

    await prisma.resumeLanguage.update({
      where: { id: id },
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeLanguage not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const language = await prisma.resumeLanguage.findUnique({ where });
    if (!language) throw new HttpError(404, "ResumeLanguage not found");

    await prisma.resumeLanguage.delete({ where });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeLanguage not found")
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string
  ): Promise<BasicResumeLanguage> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    }

    const language = await prisma.resumeLanguage.findUnique({ where });
    if (!language) throw new HttpError(404, "ResumeLanguage not found");

    return language;
  }
}
