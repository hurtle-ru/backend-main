import { Body, Controller, Delete, Get, Patch, Path, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { BasicEmployer, EmployerPutByIdRequest, EmployerPutMeRequest, GetEmployerResponse } from "./employer.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { injectable } from "tsyringe";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import { BasicMeeting } from "../meeting/meeting.dto";
import { BasicVacancy } from "../vacancy/vacancy.dto";


@injectable()
@Route("api/v1/employers")
@Tags("Employer")
export class EmployerController extends Controller {
  constructor() {
    super();
  }

  @Get("me")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.EMPLOYER])
  async getMe(
    @Request() req: JwtModel,
    @Query() include?: ("meetings" | "vacancies")[]
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
  async getAll(
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("meetings" | "vacancies")[]
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
      prisma.employer.count( { where }),
    ]);

    return new PageResponse(employers, page, size, employersCount);
  }

  @Get("{id}")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  async get(
    @Path() id: string,
    @Query() include?: ("meetings" | "vacancies")[]
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

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  async delete(@Path() id: string): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Delete("me")
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Security("jwt", [UserRole.EMPLOYER])
  async deleteMe(@Request() req: JwtModel): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Put("me")
  @Security("jwt", [UserRole.EMPLOYER])
  async putMe(
    @Request() req: JwtModel,
    @Body() body: EmployerPutMeRequest
  ): Promise<BasicEmployer> {
    const employer = await prisma.employer.update({
      where: { id: req.user.id },
      data: body,
    });

    return employer;
  }

  @Patch("me")
  @Security("jwt", [UserRole.EMPLOYER])
  async patchMe(
    @Request() req: JwtModel,
    @Body() body: Partial<EmployerPutMeRequest>
  ): Promise<BasicEmployer> {
    const employer = await prisma.employer.update({
      where: { id: req.user.id },
      data: body,
    });

    return employer;
  }

  @Put("{id}")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  async put(
    @Path() id: string,
    @Body() body: EmployerPutByIdRequest
  ): Promise<BasicEmployer> {
    const employer = await prisma.employer.update({
      where: { id },
      data: body,
    });

    return employer;
  }

  @Patch("{id}")
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  @Security("jwt", [UserRole.MANAGER])
  async patch(
    @Path() id: string,
    @Body() body: Partial<EmployerPutByIdRequest>
  ): Promise<BasicEmployer> {
    const employer = await prisma.employer.update({
      where: { id },
      data: body,
    });

    return employer;
  }
}