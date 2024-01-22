import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path, Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";
import { HhAuthService } from "../../../external/hh/auth/auth.service";
import { HhApplicantService } from "../../../external/hh/applicant/applicant.service";
import { HhResumeService } from "../../../external/hh/resume/resume.service";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HhToken } from "@prisma/client";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { GetHhResumeSummaryResponse } from "./resume.dto";
import { BasicResume } from "../../resume/resume.dto";
import { HhResumeMapper } from "./resume.mapper";


@injectable()
@Route("api/v1/hh/resumes")
@Tags("hh.ru Resume")
export class HhResumeController extends Controller {
  constructor(private readonly hhAuthService: HhAuthService,
              private readonly hhResumeMapper: HhResumeMapper,
              private readonly hhResumeService: HhResumeService,
  ) {
    super();
  }

  /**
   * Получает список резюме, доступных для импорта, в формате краткого описания (саммари).
   */
  @Get("")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & { "error": "Not authorized in hh.ru" }>(401)
  public async getAll(
    @Request() req: JwtModel,
  ): Promise<GetHhResumeSummaryResponse[]> {
    const hhToken = await prisma.hhToken.findUnique({ where: { applicantId: req.user.id } });
    if (!hhToken) throw new HttpError(401, "Not authorized in hh.ru");

    await this.hhAuthService.refreshTokenAndSaveIfNeed(hhToken);
    const hhResumes = await this.hhResumeService.getMine(hhToken.accessToken);

    return hhResumes.map(resume => ({
      id: resume.id,
      title: resume.title,
      createdAt: resume.createdAt,
    }));
  }

  /**
   * Создает соискателю новое резюме с данными, импортированными с hh.ru.
   */
  @Post("{id}/import")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & { "error": "Not authorized in hh.ru" }>(401)
  @Response<HttpErrorBody & { "error": "Resume already exists" }>(409)
  public async import(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<BasicResume> {
    const resume = await prisma.resume.findUnique({ where: { applicantId: req.user.id } });
    if(resume) throw new HttpError(409, "Resume already exists");

    const hhToken = await prisma.hhToken.findUnique({ where: { applicantId: req.user.id } });
    if (!hhToken) throw new HttpError(401, "Not authorized in hh.ru");

    await this.hhAuthService.refreshTokenAndSaveIfNeed(hhToken);
    const hhResume = await this.hhResumeService.getById(hhToken.accessToken, id);
    const mappedResume = this.hhResumeMapper.mapResume(hhResume);

    return prisma.resume.create({
      data: {
        applicantId: req.user.id,
        importedFrom: "HH",
        importedId: id,

        createdAt: mappedResume.createdAt,
        title: mappedResume.title,
        city: mappedResume.city,
        skills: mappedResume.skills,
        summary: mappedResume.summary,
        desiredSalary: mappedResume.desiredSalary,
        desiredSalaryCurrency: mappedResume.desiredSalaryCurrency,

        contacts: { create: mappedResume.contacts },
        languages: { create: mappedResume.languages },
        experience: { create: mappedResume.experience },
        education: { create: mappedResume.education },
        certificates: { create: mappedResume.certificates},
      },
    });
  }
}