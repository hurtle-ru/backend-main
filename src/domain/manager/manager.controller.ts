import { Body, Controller, Delete, Get, Patch, Path, Put, Query, Request, Response, Route, Security, Tags, UploadedFile } from "tsoa";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { BasicManager, GetManagerResponse, PutMeManagerRequest } from "./manager.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { injectable } from "tsyringe";
import { ArtifactService} from "../../external/artifact/artifact.service";
import { Readable } from 'stream';
import {Request as ExpressRequest} from 'express';
import path from "path";
import { AVAILABLE_IMAGE_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE } from "../../external/artifact/artifact.config";


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

  @Response<HttpErrorBody & {"error": "Manager not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const manager = await prisma.manager.findUnique({where: { id }})
    if(!manager) throw new HttpError(400, "Manager not found")

    await prisma.manager.archive(id);
  }

  @Delete("me")
  @Security("jwt", [UserRole.MANAGER])
  public async deleteMe(
    @Request() req: JwtModel
  ): Promise<void> {
    await prisma.manager.archive(req.user.id);
  }

  @Put("me")
  @Security("jwt", [UserRole.MANAGER])
  public async putMe(
    @Request() req: JwtModel,
    @Body() body: PutMeManagerRequest
  ): Promise<BasicManager> {
    const manager = await prisma.manager.update({
      where: { id: req.user.id },
      data: body,
    });

    return manager;
  }

  @Patch("me")
  @Security("jwt", [UserRole.MANAGER])
  public async patchMe(
    @Request() req: JwtModel,
    @Body() body: Partial<PutMeManagerRequest>
  ): Promise<BasicManager> {
    const manager = await prisma.manager.update({
      where: { id: req.user.id },
      data: body,
    });

    return manager;
  }
  @Get("{id}/avatar")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "File not found" | "Manager not found"}>(404)
  public async getAvatar(
      @Request() req: ExpressRequest & JwtModel,
      @Path() id: string,
  ): Promise<Readable | any> {
      const manager = await prisma.manager.findUnique({
        where: {id},
      })
      if (!manager) throw new HttpError(404, "Manager not found")

      const fileName = await this.ArtifactService.getFullFileName(`manager/${id}/`, 'avatar')
      const filePath = `manager/${id}/${fileName}`

      if(fileName == null) throw new HttpError(404, "File not found")

      const response = req.res;
      if (response) {
        const [stream, fileOptions] = await this.ArtifactService.loadFile(filePath);

        if (fileOptions.mimeType) response.setHeader('Content-Type', fileOptions.mimeType);
        response.setHeader('Content-Length', fileOptions.size.toString());

        stream.pipe(response)
        return stream
      }
  }

  @Put("{id}/avatar")
  @Security("jwt", [UserRole.MANAGER])
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
      where: {id},
    })

    if (!manager) throw new HttpError(404, "Manager not found")

    if (req.user.id !== id) {
      throw new HttpError(403, "Not enough rights to edit another manager")
    }

    const avatarExtension = path.extname(file.originalname)
    const avatarDirectory = `manager/${id}/`
    const avatarPath = avatarDirectory + `avatar${avatarExtension}`

    await this.ArtifactService.validateFileAttributes(file, AVAILABLE_IMAGE_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE)
    const oldAvatarFileName = await this.ArtifactService.getFullFileName(avatarDirectory, 'avatar')

    if (oldAvatarFileName !== null) {
      this.ArtifactService.deleteFile(avatarDirectory + oldAvatarFileName)
    }
    await this.ArtifactService.saveImageFile(file, avatarPath);
  }
}