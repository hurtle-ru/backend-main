import { injectable } from "tsyringe";
import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { prisma } from "../../infrastructure/database/prismaClient";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import {
  BasicResume,
  CreateResumeRequest,
  GetResumeResponse,
  PutResumeRequest,
} from "./resume.dto";

@injectable()
@Route("api/v1/resumes")
@Tags("Resume")
export class ResumeController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.APPLICANT])
  public async createEmpty(
    @Request() req: JwtModel,
    @Body() body: CreateResumeRequest,
  ): Promise<BasicResume> {
    return prisma.resume.create({
      data: {
        ...body,
        applicant: { connect: { id: req.user.id } },
        isVisibleToEmployers: false,
      },
    });
  }

  @Put("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutResumeRequest,
  ): Promise<PutResumeRequest> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { applicant: {id: req.user.id } }),
    }

    const resume = await prisma.resume.findUnique({ where });
    if(!resume) throw new HttpError(404, "Resume not found");

    return prisma.resume.update({
      where,
      data: body,
    });
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("applicant" | "certificates" | "contacts" | "education" | "experience" | "languages")[],
  ): Promise<GetResumeResponse> {
    const resume = await prisma.resume.findUnique({
      where: { applicantId: req.user.id },
      include: {
        applicant: include?.includes("applicant"),
        certificates: include?.includes("certificates"),
        contacts: include?.includes("contacts"),
        education: include?.includes("education"),
        experience: include?.includes("experience"),
        languages: include?.includes("languages"),
      },
    });

    if(!resume) throw new HttpError(404, "Resume not found");

    return resume;
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { applicant: { id: req.user.id } }),
    }

    const resume = await prisma.resume.findUnique({ where });
    if(!resume) throw new HttpError(404, "Resume not found");

    await prisma.resume.delete({ where });
  }

  @Get("{id}")
  @Response<HttpErrorBody>(404, "Resume not found or is not visible for employers")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("applicant" | "certificates" | "contacts" | "education" | "experience" | "languages")[],
  ): Promise<GetResumeResponse> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { applicantId: req.user.id }),
      ...(req.user.role === UserRole.EMPLOYER && { isVisibleToEmployers: true }),
    }

    const resume = await prisma.resume.findUnique({
      where,
      include: {
        applicant: include?.includes("applicant"),
        certificates: include?.includes("certificates"),
        contacts: include?.includes("contacts"),
        education: include?.includes("education"),
        experience: include?.includes("experience"),
        languages: include?.includes("languages"),
      },
    });

    if(!resume) throw new HttpError(404, "Resume not found or is not visible for employers");

    return resume;
  }
}