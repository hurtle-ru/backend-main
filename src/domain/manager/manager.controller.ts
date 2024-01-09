import { Body, Controller, Delete, Get, Patch, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { BasicManager, GetManagerResponse, ManagerPutMeRequest } from "./manager.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { injectable } from "tsyringe";
import { BasicMeetingSlot } from "../meeting/slot/slot.dto";


@injectable()
@Route("api/v1/managers")
@Tags("Manager")
export class ManagerController extends Controller {
  constructor() {
    super();
  }

  @Get("me")
  @Response<HttpErrorBody & {"error": "Manager not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  async getMe(
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
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Security("jwt", [UserRole.MANAGER])
  async deleteMe(@Request() req: JwtModel): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Put("me")
  @Security("jwt", [UserRole.MANAGER])
  async putMe(
    @Request() req: JwtModel,
    @Body() body: ManagerPutMeRequest
  ): Promise<BasicManager> {
    const manager = await prisma.manager.update({
      where: { id: req.user.id },
      data: body,
    });

    return manager;
  }

  @Patch("me")
  @Security("jwt", [UserRole.MANAGER])
  async patchMe(
    @Request() req: JwtModel,
    @Body() body: Partial<ManagerPutMeRequest>
  ): Promise<BasicManager> {
    const manager = await prisma.manager.update({
      where: { id: req.user.id },
      data: body,
    });

    return manager;
  }
}