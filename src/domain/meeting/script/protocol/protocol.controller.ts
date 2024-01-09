import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { MeetingScriptProtocolService } from "./protocol.service";
import { JwtModel, UserRole } from "../../../auth/auth.dto";
import { prisma } from "../../../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../../../infrastructure/error/httpError";
import {
  BasicMeetingScriptProtocol,
  CreateMeetingScriptProtocolRequest,
  GetMeetingScriptProtocolResponse,
} from "./protocol.dto";
import { PageNumber, PageSizeNumber } from "../../../../infrastructure/controller/pagination/page.dto";
import { PageResponse } from "../../../../infrastructure/controller/pagination/page.response";


@injectable()
@Route("api/v1/meetingScriptProtocols")
@Tags("Meeting Script Protocol")
export class MeetingScriptProtocolController extends Controller {
  constructor(private readonly scriptProtocolService: MeetingScriptProtocolService) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "Meeting not found" }>(404)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingScriptProtocolRequest,
  ): Promise<BasicMeetingScriptProtocol> {
    const meeting = await prisma.meeting.findUnique({
      where: { id: body.meetingId },
      select: { id: true },
    })

    if(!meeting) throw new HttpError(404, "Meeting not found");

    return prisma.meetingScriptProtocol.create({
      data: body,
    });
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("template" | "answers" | "meeting" | "meeting.slot")[],
    @Query() meetingId?: string,
    @Query() templateId?: string,
  ): Promise<PageResponse<GetMeetingScriptProtocolResponse>> {
    const where = {
      meetingId: meetingId ?? undefined,
      templateId: templateId ?? undefined,
    }

    const [protocols, protocolsCount] = await Promise.all([
      prisma.meetingScriptProtocol.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          template: include?.includes("template"),
          answers: include?.includes("answers"),
          meeting: include?.includes("meeting.slot")
            ? { include: { slot: true }}
            : include?.includes("meeting"),
        },
      }),
      prisma.meetingScriptProtocol.count({ where }),
    ])

    return new PageResponse(protocols, page, size, protocolsCount);
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptProtocol not found" }>(404)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const protocol = await prisma.meetingScriptProtocol.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!protocol) throw new HttpError(404, "MeetingScriptProtocol not found");

    await Promise.all([
      prisma.meetingScriptAnswer.deleteMany({ where: { protocolId: id } }),
      prisma.meetingScriptProtocol.delete({ where: { id } }),
    ])
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptProtocol not found" }>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("template" | "answers" | "meeting" | "meeting.slot")[]
  ): Promise<GetMeetingScriptProtocolResponse> {
    const protocol = await prisma.meetingScriptProtocol.findUnique({
      where: { id },
      include: {
        template: include?.includes("template"),
        answers: include?.includes("answers"),
        meeting: include?.includes("meeting.slot")
          ? { include: { slot: true }}
          : include?.includes("meeting"),
      },
    });

    if (!protocol) throw new HttpError(404, "MeetingScriptProtocol not found");
    return protocol;
  }
}