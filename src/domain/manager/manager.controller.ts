import path from "path";

import { Body, Controller, Delete, Get, Middlewares, Patch, Path, Put, Query, Request, Response, Route, Security, Tags, UploadedFile } from "tsoa";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { BasicManager, GetManagerResponse, PatchMeRequestByManager, PatchMeRequestByManagerSchema } from "./manager.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { injectable } from "tsyringe";
import { ArtifactService} from "../../external/artifact/artifact.service";
import { Readable } from "stream";
import { Request as ExpressRequest } from "express";
import { artifactConfig, AVAILABLE_IMAGE_FILE_MIME_TYPES } from "../../external/artifact/artifact.config";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware"


@injectable()
@Route("api/v1/managers")
@Tags("Manager")
export class ManagerController extends Controller {
  constructor(private readonly ArtifactService: ArtifactService) {
    super();
  }

  @Get("me")
  @Response<HttpErrorBody & {"error": "Manager not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async getMe(
    @Request() req: JwtModel,
    @Query() include?: ("slots")[]
  ): Promise<GetManagerResponse> {
    const manager = await prisma.manager.findUnique({
      where: { id: req.user.id },
      include: {
        slots: include?.includes("slots"),
      },
    });


    if (!manager) throw new HttpError(404, "Manager not found");
    return manager;
  }

  @Delete("me")
  @Security("jwt", [UserRole.MANAGER])
  public async deleteMe(
    @Request() req: JwtModel
  ): Promise<void> {
    await prisma.manager.archive(req.user.id);
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Manager not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const manager = await prisma.manager.findUnique({ where: { id } });
    if(!manager) throw new HttpError(404, "Manager not found");

    await prisma.manager.archive(id);
  }

  @Patch("me")
  @Security("jwt", [UserRole.MANAGER])
  public async patchMe(
    @Request() req: JwtModel,
    @Body() body: PatchMeRequestByManager
  ): Promise<BasicManager> {
    body = PatchMeRequestByManagerSchema.validateSync(body)

    return prisma.manager.update({
      where: { id: req.user.id },
      data: body,
    });
  }

  @Get("{id}/avatar")
  @Middlewares(rateLimit({limit: 30, interval: 60}))
  @Response<HttpErrorBody & {"error": "File not found" | "Manager not found"}>(404)
  public async getAvatar(
    @Request() req: ExpressRequest,
    @Path() id: string,
  ): Promise<Readable | any> {
      const manager = await prisma.manager.findUnique({
        where: { id },
      });

      if (!manager) throw new HttpError(404, "Manager not found");

      const fileName = await this.ArtifactService.getFullFileName(`manager/${id}/`, "avatar");
      const filePath = `manager/${id}/${fileName}`;

      if(fileName == null) throw new HttpError(404, "File not found");

      const response = req.res;
      if (response) {
        const [stream, fileOptions] = await this.ArtifactService.loadFile(filePath);

        if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
        response.setHeader("Content-Length", fileOptions.size.toString());

        stream.pipe(response);
        return stream;
      }
  }

  @Put("{id}/avatar")
  @Security("jwt", [UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another manager"}>(403)
  @Response<HttpErrorBody & {"error": "Manager not found"}>(404)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async uploadAvatar(
      @Request() req: JwtModel,
      @UploadedFile() file: Express.Multer.File,
      @Path() id: string,
  ): Promise<void> {
    const manager = await prisma.manager.findUnique({
      where: { id },
    })

    if (!manager) throw new HttpError(404, "Manager not found");

    if (req.user.id !== id) throw new HttpError(403, "Not enough rights to edit another manager");

    const avatarExtension = path.extname(file.originalname);
    const avatarDirectory = `manager/${id}/`;
    const avatarPath = avatarDirectory + `avatar${avatarExtension}`;

    await this.ArtifactService.validateFileAttributes(file, AVAILABLE_IMAGE_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
    const oldAvatarFileName = await this.ArtifactService.getFullFileName(avatarDirectory, "avatar");

    if (oldAvatarFileName !== null) this.ArtifactService.deleteFile(avatarDirectory + oldAvatarFileName);
    await this.ArtifactService.saveImageFile(file, avatarPath);
  }
}