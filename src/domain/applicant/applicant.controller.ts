import { Body, Controller, Delete, Get, Patch, Path, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import {
  ApplicantPutByIdRequest,
  ApplicantPutMeRequest,
  BasicApplicant, GetApplicantResponse,
} from "./applicant.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { PageResponse } from "../../infrastructure/controller/page.response";
import { injectable } from "tsyringe";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/page.dto";


@injectable()
@Route("api/v1/applicants")
@Tags("Applicant")
export class ApplicantController extends Controller {
  constructor() {
    super();
  }

  @Get("me")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT])
  async getMe(
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
  async getAll(
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("resume" | "meetings" | "assignedVacancies")[]
  ): Promise<PageResponse<GetApplicantResponse>> {
    const where = {};

    const [applicants, applicantsCount] = await Promise.all([
      prisma.applicant.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          resume: include?.includes("resume"),
          meetings: include?.includes("meetings"),
          assignedVacancies: include?.includes("assignedVacancies"),
        },
      }),
      prisma.employer.count( { where }),
    ]);

    return new PageResponse(applicants, page, size, applicantsCount);
  }

  @Get("{id}")
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  async get(
    @Path() id: string,
    @Query() include?: ("resume" | "meetings" | "assignedVacancies")[]
  ): Promise<GetApplicantResponse> {
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        resume: include?.includes("resume"),
        meetings: include?.includes("meetings"),
        assignedVacancies: include?.includes("assignedVacancies"),
      },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");
    return applicant;
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  async delete(@Path() id: string): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Delete("me")
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Security("jwt", [UserRole.APPLICANT])
  async deleteMe(@Request() req: JwtModel): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Put("me")
  @Security("jwt", [UserRole.APPLICANT])
  async putMe(
    @Request() req: JwtModel,
    @Body() body: ApplicantPutMeRequest
  ): Promise<BasicApplicant> {
    const applicant = await prisma.applicant.update({
      where: { id: req.user.id },
      data: body,
    });

    return applicant;
  }

  @Patch("me")
  @Security("jwt", [UserRole.APPLICANT])
  async patchMe(
    @Request() req: JwtModel,
    @Body() body: Partial<ApplicantPutMeRequest>
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
  async put(
    @Path() id: string,
    @Body() body: ApplicantPutByIdRequest
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
  async patch(
    @Path() id: string,
    @Body() body: Partial<ApplicantPutByIdRequest>
  ): Promise<BasicApplicant> {
    const applicant = await prisma.applicant.update({
      where: { id },
      data: body,
    });

    return applicant;
  }
}