import { injectable } from "tsyringe";
import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { MeetingScriptTemplateService } from "./template.service";
import { JwtModel, UserRole } from "../../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../../infrastructure/error/httpError";
import { prisma } from "../../../../infrastructure/database/prismaClient";
import {
  BasicMeetingScriptTemplate,
  CreateMeetingScriptTemplateRequest, GetMeetingScriptTemplateResponse,
  PutMeetingScriptTemplateRequest,
} from "./template.dto";
import { PageNumber, PageSizeNumber } from "../../../../infrastructure/controller/pagination/page.dto";
import { PageResponse } from "../../../../infrastructure/controller/pagination/page.response";
import { GetMeetingScriptProtocolResponse } from "../protocol/protocol.dto";


@injectable()
@Route("api/v1/meetingScriptTemplates")
@Tags("Meeting Script Template")
export class MeetingScriptTemplateController extends Controller {
  constructor(private readonly scriptTemplateService: MeetingScriptTemplateService) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingScriptTemplateRequest,
  ): Promise<BasicMeetingScriptTemplate> {
    return prisma.meetingScriptTemplate.create({
      data: body,
    });
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("protocols" | "questions")[],
  ): Promise<PageResponse<GetMeetingScriptTemplateResponse>> {
    const where = {}

    const [templates, templatesCount] = await Promise.all([
      prisma.meetingScriptTemplate.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          protocols: include?.includes("protocols"),
          questions: include?.includes("questions"),
        },
      }),
      prisma.meetingScriptTemplate.count({ where }),
    ])

    return new PageResponse(templates, page, size, templatesCount);
  }

  @Put("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptTemplate not found" }>(404)
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutMeetingScriptTemplateRequest,
  ): Promise<void> {
    const template = await prisma.meetingScriptTemplate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!template) throw new HttpError(404, "MeetingScriptTemplate not found");

    await prisma.meetingScriptTemplate.update({
      where: { id },
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptTemplate not found" }>(404)
  @Response<HttpErrorBody & { "error": "MeetingScriptTemplate is in use by some protocols" }>(409)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const template = await prisma.meetingScriptTemplate.findUnique({
      where: { id },
      select: { id: true },
    });

    if(!template) throw new HttpError(404, "MeetingScriptTemplate not found");

    const usesCount = await prisma.meetingScriptProtocol.count({
      where: { templateId: id },
    });

    if(usesCount > 0) throw new HttpError(409, "MeetingScriptTemplate is in use by some protocols");

    await prisma.meetingScriptTemplate.delete({
      where: { id },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptTemplate not found" }>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("protocols" | "questions")[]
  ): Promise<GetMeetingScriptTemplateResponse> {
    const template = await prisma.meetingScriptTemplate.findUnique({
      where: { id },
      include: {
        protocols: include?.includes("protocols"),
        questions: include?.includes("questions"),
      },
    });

    if (!template) throw new HttpError(404, "MeetingScriptTemplate not found");
    return template;
  }
}