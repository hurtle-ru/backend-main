import path from "path";
import { injectable } from "tsyringe";
import { Readable } from "stream";

import { Request as ExpressRequest } from "express";

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
  BasicEmployer,
  GetEmployerResponse,
  PatchByIdByEmployerRequest,
  PatchByIdByEmployerRequestSchema,
  PatchMeByEmployerRequest,
  PatchMeByEmployerRequestSchema,
} from "./employer.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { artifactConfig, AVAILABLE_IMAGE_FILE_MIME_TYPES } from "../../external/artifact/artifact.config";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware";


@injectable()
@Route("api/v1/employers")
@Tags("Employer")
export class EmployerController extends Controller {
  constructor(private readonly artifactService: ArtifactService) {
    super();
  }

  @Get("me")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.EMPLOYER])
  public async getMe(
    @Request() req: JwtModel,
    @Query() include?: ("meetings" | "vacancies")[],
  ): Promise<GetEmployerResponse> {
    const employer = await prisma.employer.findUnique({
      where: { id: req.user.id },
      include: {
        meetings: include?.includes("meetings"),
        vacancies: include?.includes("vacancies"),
      },
    });


    if (!employer) throw new HttpError(404, "Employer not found");
    return employer;
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("meetings" | "vacancies")[],
  ): Promise<PageResponse<GetEmployerResponse>> {
    const where = {};

    const [employers, employersCount] = await Promise.all([
      prisma.employer.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          meetings: include?.includes("meetings"),
          vacancies: include?.includes("vacancies"),
        },
      }),
      prisma.employer.count({ where }),
    ]);

    return new PageResponse(employers, page, size, employersCount);
  }

  @Delete("me")
  @Security("jwt", [UserRole.EMPLOYER])
  public async deleteMe(
    @Request() req: JwtModel,
  ): Promise<void> {
    await prisma.employer.archive(req.user.id);
  }

  @Patch("me")
  @Security("jwt", [UserRole.EMPLOYER])
  public async patchMe(
    @Request() req: JwtModel,
    @Body() body: PatchMeByEmployerRequest,
  ): Promise<BasicEmployer> {
    body = PatchMeByEmployerRequestSchema.validateSync(body);

    const employer = await prisma.employer.update({
      where: { id: req.user.id },
      data: body,
    });

    return employer;
  }

  @Get("{id}/avatar")
  @Middlewares(rateLimit({ limit: 300, interval: 60 }))
  @Response<HttpErrorBody & {"error": "File not found" | "Employer not found"}>(404)
  public async getAvatar(
    @Request() req: ExpressRequest,
    @Path() id: string,
  ): Promise<Readable | any> {
    const employer = await prisma.employer.findUnique({
      where: { id },
    });

    if (!employer) throw new HttpError(404, "Employer not found");

    const fileName = await this.artifactService.getFullFileName(`employer/${id}/`, "avatar");
    const filePath = `employer/${id}/${fileName}`;

    if (fileName == null) throw new HttpError(404, "File not found");

    const response = req.res;
    if (response) {
      const [stream, fileOptions] = await this.artifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response);
      return stream;
    }
  }

  @Put("{id}/avatar")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Middlewares(rateLimit({ limit: 10, interval: 60 }))
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another employer"}>(403)
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async uploadAvatar(
      @Request() req: JwtModel,
      @UploadedFile() file: Express.Multer.File,
      @Path() id: string,
  ): Promise<void> {
    const employer = await prisma.employer.findUnique({
      where: { id },
    });

    if (!employer) throw new HttpError(404, "Employer not found");

    if (req.user.role !== UserRole.MANAGER && req.user.id !== id)
      throw new HttpError(403, "Not enough rights to edit another employer");

    const avatarExtension = path.extname(file.originalname);
    const avatarDirectory = `employer/${id}/`;
    const avatarPath = avatarDirectory + `avatar${avatarExtension}`;

    await this.artifactService.validateFileAttributes(file, AVAILABLE_IMAGE_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
    const oldAvatarFileName = await this.artifactService.getFullFileName(avatarDirectory, "avatar");

    if (oldAvatarFileName !== null)
      this.artifactService.deleteFile(avatarDirectory + oldAvatarFileName);

    await this.artifactService.saveImageFile(file, avatarPath);
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another employer"}>(403)
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const employer = await prisma.employer.findUnique({ where: { id } });

    if (!employer) throw new HttpError(404, "Employer not found");
    if (req.user.id !== id && req.user.role !== UserRole.MANAGER) throw new HttpError(403, "Not enough rights to edit another employer");

    await prisma.employer.archive(id);
  }

  @Patch("{id}")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async patchById(
    @Path() id: string,
    @Body() body: PatchByIdByEmployerRequest,
  ): Promise<BasicEmployer> {
    body = PatchByIdByEmployerRequestSchema.validateSync(body);

    const where = { id };
    if (!await prisma.employer.exists(where)) throw new HttpError(404, "Employer not found");

    return prisma.employer.update({
      where,
      data: body,
    });
  }

  @Get("{id}")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async getById(
    @Path() id: string,
    @Query() include?: ("meetings" | "vacancies")[],
  ): Promise<GetEmployerResponse> {
    const employer = await prisma.employer.findUnique({
      where: { id },
      include: {
        meetings: include?.includes("meetings"),
        vacancies: include?.includes("vacancies"),
      },
    });

    if (!employer) throw new HttpError(404, "Employer not found");
    return employer;
  }
}