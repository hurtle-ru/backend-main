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
import {
  BasicVacancy,
  CreateVacancyRequest,
  GetVacancyResponse, PutVacancyRequestFromEmployer, PutVacancyRequestFromManager,
} from "./vacancy.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
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

    return new PageResponse(
      vacancies.map(vacancy => {
        const { uniqueViewerApplicantIds, ...vacancyWithoutViewers } = vacancy;
        return {
          ...vacancyWithoutViewers,
          viewersCount: uniqueViewerApplicantIds.length,
        };
      }),
      page, size, vacanciesCount
    );
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

    return new PageResponse(
      vacancies.map(vacancy => {
        const { uniqueViewerApplicantIds, ...vacancyWithoutViewers } = vacancy;
        return {
          ...vacancyWithoutViewers,
          viewersCount: uniqueViewerApplicantIds.length,
        };
      }),
      page, size, vacanciesCount
    );
  }

  @Put("{id}/isConfirmedByManager")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async putIsConfirmedByManager(
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

  /**
   * Метод должен вызываться каждый раз, когда соискатель впервые заходит на страницу вакансии
   * Фронтенд должен локально хранить вакансии (их ID), которые уже были просмотрены соискателем, чтобы не вызывать этот метод повторно
   */
  @Post("{id}/viewed")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Response<HttpErrorBody & {"error": "Applicant already viewed this vacancy"}>(409)
  public async addViewed(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");
    if(vacancy.uniqueViewerApplicantIds.includes(req.user.id)) throw new HttpError(409, "Applicant already viewed this vacancy");

    await prisma.vacancy.update({
      where: { id },
      data: {
        uniqueViewerApplicantIds: {
          push: req.user.id,
        },
      },
    });
  }

  @Put("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Response<HttpErrorBody & {"error": "Invalid body request for employer" | "Invalid body request for manager"}>(403)
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutVacancyRequestFromEmployer | PutVacancyRequestFromManager,
  ): Promise<BasicVacancy> {
    if(req.user.role === UserRole.EMPLOYER && !(body instanceof PutVacancyRequestFromEmployer))
      throw new HttpError(403, "Invalid body request for employer")

    if(req.user.role === UserRole.MANAGER && !(body instanceof PutVacancyRequestFromManager))
      throw new HttpError(403, "Invalid body request for manager")

    const vacancy = await prisma.vacancy.findUnique({
      where: { id, employerId: req.user.id },
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    return prisma.vacancy.update({
      where: { id, employerId: req.user.id },
      data: body,
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Response<HttpErrorBody & {"error": "Invalid body request for employer" | "Invalid body request for manager"}>(403)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutVacancyRequestFromEmployer | PutVacancyRequestFromManager>,
  ): Promise<BasicVacancy> {
    if(req.user.role === UserRole.EMPLOYER && !(body instanceof PutVacancyRequestFromEmployer))
      throw new HttpError(403, "Invalid body request for employer")

    if(req.user.role === UserRole.MANAGER && !(body instanceof PutVacancyRequestFromManager))
      throw new HttpError(403, "Invalid body request for manager")

    const vacancy = await prisma.vacancy.findUnique({
      where: { id, employerId: req.user.id },
    });

    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    return prisma.vacancy.update({
      where: { id, employerId: req.user.id },
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
    let where = null;
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

    const { uniqueViewerApplicantIds, ...vacancyWithoutViewers } = vacancy;
    return {
      ...vacancyWithoutViewers,
      viewersCount: vacancy.uniqueViewerApplicantIds.length,
    };
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another vacancy"}>(403)
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const vacancy = await prisma.vacancy.findUnique({where: { id }});
    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    if (req.user.id !== vacancy.employerId && req.user.role != UserRole.MANAGER) {
      throw new HttpError(403, "Not enough rights to edit another vacancy");
    }

    await prisma.vacancy.delete({where: { id }});
  }
}
