import { injectable, } from "tsyringe";
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
import { prisma, } from "../../infrastructure/database/prisma.provider";
import { JwtModel, PUBLIC_SCOPE, UserRole, } from "../auth/auth.dto";
import { HttpError, HttpErrorBody, } from "../../infrastructure/error/http.error";
import {
  BasicResume,
  CreateResumeRequest,
  CreateResumeRequestSchema,
  GetResumeResponse,
  PatchByIdResumeRequest,
  PatchByIdResumeRequestSchema,
  PatchResumeResponse,
} from "./resume.dto";
import { Prisma, } from "@prisma/client";


@injectable()
@Route("api/v1/resumes",)
@Tags("Resume",)
export class ResumeController extends Controller {
  constructor() {
    super();
  }

  @Post("",)
  @Security("jwt", [UserRole.APPLICANT,],)
  @Response<HttpErrorBody & { "error": "Resume already exists" }>(409,)
  public async createEmpty(
    @Request() req: JwtModel,
    @Body() body: CreateResumeRequest,
  ): Promise<BasicResume> {
    body = CreateResumeRequestSchema.validateSync(body,);

    const resume = await prisma.resume.findUnique({
      where: { applicantId: req.user.id, },
    },);
    if (resume) throw new HttpError(409, "Resume already exists.",);

    return prisma.resume.create({
      data: {
        ...body,
        applicant: { connect: { id: req.user.id, }, },
        isVisibleToEmployers: true,
      },
    },);
  }

  @Get("my",)
  @Security("jwt", [UserRole.APPLICANT,],)
  @Response<HttpErrorBody>(404, "Resume not found",)
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("applicant" | "certificates" | "contacts" | "education" | "experience" | "languages")[],
  ): Promise<GetResumeResponse> {
    const resume = await prisma.resume.findUnique({
      where: { applicantId: req.user.id, },
      include: {
        applicant: include?.includes("applicant",),
        certificates: include?.includes("certificates",),
        contacts: include?.includes("contacts",),
        education: include?.includes("education",),
        experience: include?.includes("experience",),
        languages: include?.includes("languages",),
      },
    },);

    if (!resume) throw new HttpError(404, "Resume not found",);

    return resume;
  }

  @Delete("{id}",)
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER,],)
  @Response<HttpErrorBody>(404, "Resume not found",)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { applicant: { id: req.user.id, }, }),
    };

    const resume = await prisma.resume.findUnique({ where, },);
    if (!resume) throw new HttpError(404, "Resume not found",);

    await prisma.resume.delete({ where, },);
  }

  @Get("{id}",)
  @Response<HttpErrorBody>(404, "Resume not found or is not visible for employers",)
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER, PUBLIC_SCOPE,],)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("applicant" | "certificates" | "contacts" | "education" | "experience" | "languages")[],
  ): Promise<GetResumeResponse> {
    let where: Prisma.ResumeWhereUniqueInput = { id, };

    if (req.user) {
      switch (req.user.role) {
      case UserRole.APPLICANT:
        where = { ...where, applicantId: req.user.id, };
        break;
      case UserRole.EMPLOYER:
        where = { ...where, isVisibleToEmployers: true, };
        break;
      }
    } else {
      where = { ...where, isVisibleToEmployers: true, };
    }

    const resume = await prisma.resume.findUnique({
      where,
      include: {
        applicant: include?.includes("applicant",),
        certificates: include?.includes("certificates",),
        contacts: include?.includes("contacts",),
        education: include?.includes("education",),
        experience: include?.includes("experience",),
        languages: include?.includes("languages",),
      },
    },);

    if (!resume) throw new HttpError(404, "Resume not found or is not visible for employers",);

    return resume;
  }

  @Patch("{id}",)
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER,],)
  @Response<HttpErrorBody>(404, "Resume not found",)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchByIdResumeRequest,
  ): Promise<PatchResumeResponse> {
    body = PatchByIdResumeRequestSchema.validateSync(body,);

    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { applicant: {id: req.user.id, }, }),
    };

    const resume = await prisma.resume.findUnique({ where, },);
    if (!resume) throw new HttpError(404, "Resume not found",);

    return prisma.resume.update({
      where,
      data: body,
    },);
  }
}
