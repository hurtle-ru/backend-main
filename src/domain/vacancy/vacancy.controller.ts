import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { BasicVacancy, CreateVacancyRequest, GetVacancyResponse, PutVacancyRequest } from "./vacancy.dto";
import { prisma } from "../../infrastructure/database/prismaClient";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";

@injectable()
@Route("api/v1/vacancies")
@Tags("Vacancy")
export class VacancyController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.EMPLOYER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateVacancyRequest,
  ): Promise<BasicVacancy> {
    return prisma.vacancy.create({
      data: {
        ...body,
        employer: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Query() include?: ("employer" | "candidates")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() employerId?: string,
    @Query() candidateId?: string,
  ): Promise<PageResponse<GetVacancyResponse>> {
    const where = {
      employerId: employerId ?? undefined,
      candidates: candidateId ? { some: { id: candidateId } } : undefined,
    }

    const [vacancies, vacanciesCount] = await Promise.all([
      prisma.vacancy.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          employer: include?.includes("employer"),
          candidates: include?.includes("candidates"),
        },
      }),
      prisma.vacancy.count({ where }),
    ]);

    return new PageResponse(vacancies, page, size, vacanciesCount);
  }

  @Get("my")
  @Security("jwt", [UserRole.EMPLOYER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("employer" | "candidates")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetVacancyResponse>> {
    const where = {
        employerId: req.user.id,
    };

    const [vacancies, vacanciesCount] = await Promise.all([
      prisma.vacancy.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          employer: include?.includes("employer"),
          candidates: include?.includes("candidates"),
        },
      }),
      prisma.vacancy.count({ where }),
    ]);

    return new PageResponse(vacancies, page, size, vacanciesCount);
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Method temporarily unavailable"}>(503)
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async delete(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    throw new HttpError(503, "Method temporarily unavailable");
  }

  @Put("{id}/isConfirmedByManager")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async setIsConfirmedByManager(
    @Path() id: string,
    @Body() isConfirmedByManager: boolean,
  ): Promise<void> {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    await prisma.vacancy.update({
      where: { id },
      data: { isConfirmedByManager },
    });
  }

  @Post("{id}/candidates/{applicantId}")
  @Security("jwt", [UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "Vacancy not found" | "Applicant not found"}>(404)
  public async addCandidate(
    @Path() id: string,
    @Path() applicantId: string,
  ): Promise<void> {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
    });

    if(!applicant) throw new HttpError(404, "Applicant not found");

    await prisma.vacancy.update({
      where: { id },
      data: {
        candidates: {
          connect: {
            id: applicantId,
          },
        },
      },
    });
  }

  @Put("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutVacancyRequest,
  ): Promise<BasicVacancy> {
    let where;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, employerId: req.user.id };

    const vacancy = await prisma.vacancy.findUnique({
      where: where!,
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    return prisma.vacancy.update({
      where: where!,
      data: body,
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutVacancyRequest>,
  ): Promise<BasicVacancy> {
    let where;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, employerId: req.user.id };

    const vacancy = await prisma.vacancy.findUnique({
      where: where!,
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    return prisma.vacancy.update({
      where: where!,
      data: body,
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("employer" | "candidates")[]
  ): Promise<GetVacancyResponse> {
    let where;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, employerId: req.user.id };
    else if(req.user.role === UserRole.APPLICANT) where = { id, candidates: { some: { id: req.user.id } }};

    const vacancy = await prisma.vacancy.findUnique({
      where: where!,
      include: {
        employer: include?.includes("employer"),
        candidates: include?.includes("candidates"),
      },
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    return vacancy;
  }
}