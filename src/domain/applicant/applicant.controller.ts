import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Patch,
  Path,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import {
  BasicApplicant,
  GetApplicantResponse,
  GetApplicantStatusResponse,
  PutByIdRequestByApplicant,
  PutMeRequestByApplicant,
} from "./applicant.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { injectable } from "tsyringe";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { Readable } from "stream";
import { Request as ExpressRequest } from "express";
import path from "path";
import { artifactConfig, AVAILABLE_IMAGE_FILE_MIME_TYPES } from "../../external/artifact/artifact.config";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware"
import { makeSchemeWithAllOptionalFields } from "../../infrastructure/validation/requests/optionalScheme";


@injectable()
@Route("api/v1/applicants")
@Tags("Applicant")
export class ApplicantController extends Controller {
  constructor(private readonly ArtifactService: ArtifactService) {
    super();
  }

  @Get("me")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT])
  public async getMe(
    @Request() req: JwtModel,
    @Query() include?: ("resume" | "meetings" | "vacancyResponses")[]
  ): Promise<GetApplicantResponse> {
    const applicant = await prisma.applicant.findUnique({
      where: { id: req.user.id },
      include: {
        resume: include?.includes("resume"),
        meetings: include?.includes("meetings"),
        vacancyResponses: include?.includes("vacancyResponses"),
      },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");
    return applicant;
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  public async getAll(
    @Request() req: JwtModel,
    @Query() nickname?: string,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("resume" | "meetings" | "vacancyResponses")[],
    @Query() has?: ("resume" | "meetings" | "vacancyResponses")[]
  ): Promise<PageResponse<GetApplicantResponse>> {
    const where = {
      nickname,
      ...(has?.includes("resume") && req.user.role === UserRole.MANAGER && { NOT: { resume: null } } ),
      ...(has?.includes("resume") && req.user.role === UserRole.EMPLOYER && { resume: { isVisibleToEmployers: true } } ),
      ...(has?.includes("meetings") && { meetings: { some: {} } } ),
      ...(has?.includes("vacancyResponses") && { vacancyResponses: { some: {} } } ),
    };

    let includeResume: any = false;
    if(include?.includes("resume") && req.user.role === UserRole.MANAGER)
      includeResume = true;
    if(include?.includes("resume") && req.user.role === UserRole.EMPLOYER)
      includeResume = { where: { isVisibleToEmployers: true } };

    const [applicants, applicantsCount] = await Promise.all([
      prisma.applicant.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          resume: includeResume,
          meetings: include?.includes("meetings"),
          vacancyResponses: include?.includes("vacancyResponses"),
        },
      }),
      prisma.applicant.count({ where }),
    ]);

    return new PageResponse(applicants, page, size, applicantsCount);
  }

  @Delete("me")
  @Security("jwt", [UserRole.APPLICANT])
  public async deleteMe(
    @Request() req: JwtModel
  ): Promise<void> {
    await prisma.applicant.archive(req.user.id);
  }

  @Patch("me")
  @Security("jwt", [UserRole.APPLICANT])
  public async patchMe(
    @Request() req: JwtModel,
    @Body() body: Partial<PutMeRequestByApplicant>
  ): Promise<BasicApplicant> {
    makeSchemeWithAllOptionalFields(PutMeRequestByApplicant.schema).validateSync(body);

    return prisma.applicant.update({
      where: { id: req.user.id },
      data: body,
    });
  }

  @Get("{id}/status")
  @Response<HttpErrorBody & {"error": "Applicant can only get his own status"}>(403)
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  public async getApplicantStatus(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<GetApplicantStatusResponse> {
    if(req.user.role === UserRole.APPLICANT && req.user.id !== id) throw new HttpError(403, "Applicant can only get his own status");

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      select: {
        isEmailConfirmed: true,
        resume: true,
        meetings: true,
      },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");

    return {
      "isEmailConfirmed": applicant.isEmailConfirmed,
      "hasResume": !!applicant.resume,
      "hasMeeting": applicant.meetings.length > 0,
    };
  }

  @Get("{id}/avatar")
  @Middlewares(rateLimit({limit: 30, interval: 60}))
  @Response<HttpErrorBody & {"error": "File not found" | "Applicant not found"}>(404)
  public async getAvatar(
    @Request() req: ExpressRequest,
    @Path() id: string,
  ): Promise<Readable | any> {
    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");

    const fileName = await this.ArtifactService.getFullFileName(`applicant/${id}/`, "avatar");
    const filePath = `applicant/${id}/${fileName}`;

    if(fileName == null) throw new HttpError(404, "File not found");

    const response = req.res;
    if (response) {
      req.log.trace("File path: ", filePath);
      const [stream, fileOptions] = await this.ArtifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response);
      return stream;
    }
  }

  @Put("{id}/avatar")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another applicant"}>(403)
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async uploadAvatar(
      @Request() req: JwtModel,
      @UploadedFile() file: Express.Multer.File,
      @Path() id: string,
  ): Promise<void> {
    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant) throw new HttpError(404, "Applicant not found");

    if (req.user.role !== UserRole.MANAGER && req.user.id !== id)
      throw new HttpError(403, "Not enough rights to edit another applicant");

    const avatarExtension = path.extname(file.originalname);
    const avatarDirectory = `applicant/${id}/`;
    const avatarPath = avatarDirectory + `avatar${avatarExtension}`;

    await this.ArtifactService.validateFileAttributes(file, AVAILABLE_IMAGE_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
    const oldAvatarFileName = await this.ArtifactService.getFullFileName(avatarDirectory, "avatar");

    if (oldAvatarFileName !== null) this.ArtifactService.deleteFile(avatarDirectory + oldAvatarFileName);

    await this.ArtifactService.saveImageFile(file, avatarPath);
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another applicant"}>(403)
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const applicant = await prisma.applicant.findUnique({ where: { id } });

    if(!applicant) throw new HttpError(404, "Applicant not found");
    if (req.user.id !== id && req.user.role !== UserRole.MANAGER) throw new HttpError(403, "Not enough rights to edit another applicant");

    await prisma.applicant.archive(id);
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("resume" | "meetings" | "vacancyResponses" | "aiChats")[]
  ): Promise<GetApplicantResponse> {
    let includeResume: any = false;
    let includeAiChats: any = false;

    switch(req.user.role) {
      case UserRole.MANAGER:
        if(include?.includes("resume")) includeResume = true;
        if(include?.includes("aiChats")) includeAiChats = true;
        break;
      case UserRole.EMPLOYER:
        if(include?.includes("resume")) includeResume = { where: { isVisibleToEmployers: true } };
        if(include?.includes("aiChats")) includeAiChats = { where: { employerId: req.user.id } }
        break;
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        resume: includeResume,
        meetings: include?.includes("meetings"),
        vacancyResponses: include?.includes("vacancyResponses"),
        aiChats: includeAiChats,
      },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");
    return applicant;
  }

  @Patch("{id}")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async patchById(
    @Path() id: string,
    @Body() body: Partial<PutByIdRequestByApplicant>
  ): Promise<BasicApplicant> {
    makeSchemeWithAllOptionalFields(PutByIdRequestByApplicant.schema).validateSync(body);

    const where = { id };
    if(!await prisma.applicant.exists(where)) throw new HttpError(404, "Applicant not found");

    return prisma.applicant.update({
      where,
      data: body,
    });
  }
}
