import {
  Body,
  Controller,
  Delete,
  Get,
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
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import {
  BasicApplicant,
  GetApplicantResponse,
  GetApplicantStatusResponse,
  PutByIdApplicantRequest,
  PutMeApplicantRequest,
} from "./applicant.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { injectable } from "tsyringe";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { Readable } from "stream";
import { Request as ExpressRequest } from "express";
import path from "path";
import { AVAILABLE_IMAGE_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE } from "../../external/artifact/artifact.config";


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
    @Query() include?: ("resume" | "meetings" | "assignedVacancies")[]
  ): Promise<GetApplicantResponse> {
    const applicant = await prisma.applicant.findUnique({
      where: { id: req.user.id },
      include: {
        resume: include?.includes("resume"),
        meetings: include?.includes("meetings"),
        assignedVacancies: include?.includes("assignedVacancies"),
      },
    });


    if (!applicant) throw new HttpError(404, "Applicant not found");
    return applicant;
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("resume" | "meetings" | "assignedVacancies")[]
  ): Promise<PageResponse<GetApplicantResponse>> {
    const where = {};

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
          assignedVacancies: include?.includes("assignedVacancies"),
        },
      }),
      prisma.employer.count( { where }),
    ]);

    return new PageResponse(applicants, page, size, applicantsCount);
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async deleteById(@Path() id: string): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Delete("me")
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Security("jwt", [UserRole.APPLICANT])
  public async deleteMe(@Request() req: JwtModel): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Put("me")
  @Security("jwt", [UserRole.APPLICANT])
  public async putMe(
    @Request() req: JwtModel,
    @Body() body: PutMeApplicantRequest
  ): Promise<BasicApplicant> {
    const applicant = await prisma.applicant.update({
      where: { id: req.user.id },
      data: body,
    });

    return applicant;
  }

  @Patch("me")
  @Security("jwt", [UserRole.APPLICANT])
  public async patchMe(
    @Request() req: JwtModel,
    @Body() body: Partial<PutMeApplicantRequest>
  ): Promise<BasicApplicant> {
    const applicant = await prisma.applicant.update({
      where: { id: req.user.id },
      data: body,
    });

    return applicant;
  }

  @Put("{id}")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async putById(
    @Path() id: string,
    @Body() body: PutByIdApplicantRequest
  ): Promise<BasicApplicant> {
    const applicant = await prisma.applicant.update({
      where: { id },
      data: body,
    });

    return applicant;
  }

  @Patch("{id}")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async patchById(
    @Path() id: string,
    @Body() body: Partial<PutByIdApplicantRequest>
  ): Promise<BasicApplicant> {
    const applicant = await prisma.applicant.update({
      where: { id },
      data: body,
    });

    return applicant;
  }

  @Get("{id}/status")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  public async getApplicantStatus(
    @Request() req: JwtModel,
  ): Promise<GetApplicantStatusResponse> {
    const applicant = await prisma.applicant.findUnique({
      where: { id: req.user.id },
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

  @Get("{id}")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("resume" | "meetings" | "assignedVacancies")[]
  ): Promise<GetApplicantResponse> {
    let includeResume: any = false;
    if(include?.includes("resume") && req.user.role === UserRole.MANAGER)
      includeResume = true;
    if(include?.includes("resume") && req.user.role === UserRole.EMPLOYER)
      includeResume = { where: { isVisibleToEmployers: true } };

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        resume: includeResume,
        meetings: include?.includes("meetings"),
        assignedVacancies: include?.includes("assignedVacancies"),
      },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");
    return applicant;
  }

  @Get("{id}/avatar")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "File not found"}>(404)
  public async getAvatar(
      @Request() req: ExpressRequest & JwtModel,
      @Path() id: string,
  ): Promise<Readable | any> {
      const fileName = await this.ArtifactService.getFullFileName(`applicant/${id}/`, 'avatar')
      const filePath = `applicant/${id}/${fileName}`

      if(fileName == null) throw new HttpError(404, "File not found")

      const response = req.res;
      if (response) {
        console.log("File path: ", filePath)
        const [stream, fileOptions] = await this.ArtifactService.loadFile(filePath);

        if (fileOptions.mimeType) response.setHeader('Content-Type', fileOptions.mimeType);
        response.setHeader('Content-Length', fileOptions.size.toString());

        stream.pipe(response)
        return stream
      }
  }

  @Put("{id}/avatar")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async uploadAvatar(
      @Request() req: JwtModel,
      @UploadedFile() file: Express.Multer.File,
      @Path() id: string,
  ): Promise<void> {
    const avatarExtension = path.extname(file.originalname)
    const avatarDirectory = `applicant/${id}/`
    const avatarPath = avatarDirectory + `avatar${avatarExtension}`

    await this.ArtifactService.validateFileAttributes(file, AVAILABLE_IMAGE_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE)
    const oldAvatarFileName = await this.ArtifactService.getFullFileName(avatarDirectory, 'avatar')

    if (oldAvatarFileName !== null) this.ArtifactService.deleteFile(avatarDirectory + oldAvatarFileName);

    await this.ArtifactService.saveImageFile(file, avatarPath);
  }
}