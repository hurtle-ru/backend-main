import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get, Middlewares,
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
  CreateVacancyRequest, GetAllVacancyCitiesResponse,
  GetVacancyResponse,
  PatchVacancyRequestFromEmployer,
  PatchVacancyRequestFromManager,
  PutVacancyRequestFromEmployer,
  PutVacancyRequestFromManager,
} from "./vacancy.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { JwtModel, PUBLIC_SCOPE, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import {
  Currency,
  Prisma, Vacancy,
  VacancyEmploymentType, VacancyExperience,
  VacancyReportingForm, VacancyTeamRole,
  VacancyWorkingHours,
  VacancyWorkplaceModel,
} from "@prisma/client";
import { IntFilterString, parseIntFilterQueryParam } from "../../infrastructure/controller/filter/number-filter.dto";
import { publicCacheMiddleware } from "../../infrastructure/cache/public-cache.middleware";
import { Request as ExpressRequest } from "express";


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
  @Security("jwt", [UserRole.MANAGER, UserRole.APPLICANT, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "User must be authorized to see vacancy responses"}>(401)
  public async getAll(
    @Request() req: JwtModel | { user: null },
    @Query() include?: ("employer" | "responses")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() nameOrEmployerName?: string,
    @Query() employerId?: string,
    @Query() teamRole?: VacancyTeamRole[],
    @Query() experience?: VacancyExperience[],
    @Query() employmentType?: VacancyEmploymentType[],
    @Query("salary") salaryFilter?: IntFilterString,
    @Query() salaryCurrency?: Currency,
    @Query() city?: string,
    @Query() reportingForm?: VacancyReportingForm[],
    @Query() workingHours?: VacancyWorkingHours[],
    @Query() workplaceModel?: VacancyWorkplaceModel[],
    @Query() isConfirmedByManager?: boolean,
    @Query() employer_isStartup?: boolean,
  ): Promise<PageResponse<GetVacancyResponse>> {
    const salary = parseIntFilterQueryParam(salaryFilter);

    let where: Prisma.VacancyWhereInput = {};
    let includeResponses: boolean | Prisma.Vacancy$responsesArgs | null = include?.includes("responses") ?? false;

    if(req.user) {
      switch(req.user.role) {
        case UserRole.APPLICANT:
          if(includeResponses) includeResponses = includeResponses = { where: { candidateId: req.user.id } };
          break;
      }
    } else {
      if(includeResponses) throw new HttpError(401, "User must be authorized to see vacancy responses")
    }

    where = {
      ...where,
      employerId: employerId ?? undefined,
      teamRole: { in: teamRole ?? undefined },
      experience: { in: experience ?? undefined },
      employmentType: { in: employmentType ?? undefined },
      salary: salary ?? undefined,
      salaryCurrency: salaryCurrency ?? undefined,
      city: city ?? undefined,
      reportingForm: { in: reportingForm ?? undefined },
      workingHours: { in: workingHours ?? undefined },
      workplaceModel: { in: workplaceModel ?? undefined },
      isConfirmedByManager: isConfirmedByManager ?? undefined,
      employer: { isStartup: employer_isStartup ?? undefined },
      OR: nameOrEmployerName ? [
        { name: { contains: nameOrEmployerName, mode: "insensitive" } },
        { employer: { name: { contains: nameOrEmployerName, mode: "insensitive" } } },
      ] : undefined,
    }

    const [vacancies, vacanciesCount] = await Promise.all([
      prisma.vacancy.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        include: {
          employer: include?.includes("employer"),
          responses: includeResponses,
        },
      }),
      prisma.vacancy.count({ where: where! }),
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
  @Security("jwt", [UserRole.EMPLOYER, UserRole.APPLICANT])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("employer" | "responses" | "responses.candidate")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetVacancyResponse>> {
    let where = null;
    let includeResponses: boolean | Prisma.Vacancy$responsesArgs = include?.includes("responses") ?? false;

    if(req.user.role === UserRole.EMPLOYER) {
      where = { employerId: req.user.id };

      if(include?.includes("responses.candidate")) {
        includeResponses = {
          include: { candidate: true },
        };
      }
    } else if(req.user.role === UserRole.APPLICANT) {
      where = { responses: { some: { candidateId: req.user.id } } };

      if(includeResponses) {
        includeResponses = {
          where: { candidateId: req.user.id },
        };
      }
    }

    const [vacancies, vacanciesCount] = await Promise.all([
      prisma.vacancy.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        include: {
          employer: include?.includes("employer"),
          responses: includeResponses,
        },
      }),
      prisma.vacancy.count({ where: where! }),
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


  /*
  * Метод получения всех городов, указанных в вакансиях
  * Используется краткосрочное кешировние
  */
  @Get("cities")
  @Middlewares(publicCacheMiddleware(20 * 60))
  public async getAllCities(): Promise<GetAllVacancyCitiesResponse> {
    const citiesAggregation = await prisma.vacancy.groupBy({
      by: ["city"],
      _count: {
        city: true,
      },
    });

    const cities = citiesAggregation.map(aggregation => aggregation.city);

    return {
      cities,
      total: cities.length,
    };
  }

  @Put("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Response<HttpErrorBody & {"error": "Invalid body request for employer" | "Invalid body request for manager"}>(403)
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutVacancyRequestFromEmployer | PutVacancyRequestFromManager,
  ): Promise<void> {
    await this.patchById(req, id, body);
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Response<HttpErrorBody & {"error": "Invalid body request for employer" | "Invalid body request for manager"}>(403)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchVacancyRequestFromEmployer | PatchVacancyRequestFromManager,
  ): Promise<void> {
    const { _requester, ...bodyData } = body;
    if(req.user.role === UserRole.EMPLOYER && _requester !== UserRole.EMPLOYER) throw new HttpError(403, "Invalid body request for employer");
    if(req.user.role === UserRole.MANAGER && _requester !== UserRole.MANAGER) throw new HttpError(403, "Invalid body request for manager");

    const where = {
      id,
      ...(req.user.role === UserRole.EMPLOYER && { employerId: req.user.id }),
    };

    const vacancy = await prisma.vacancy.findUnique({ where });
    if(!vacancy) throw new HttpError(404, "Vacancy not found");

    await prisma.vacancy.update({
      where,
      data: bodyData,
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "User must be authorized to see vacancy responses"}>(401)
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  public async getById(
    @Request() req: JwtModel | { user: null },
    @Path() id: string,
    @Query() include?: ("employer" | "responses")[]
  ): Promise<GetVacancyResponse> {
    let includeResponses: boolean | Prisma.Vacancy$responsesArgs = include?.includes("responses") ?? false;
    const where = { id };

    if(req.user) {
      switch (req.user.role) {
        case UserRole.EMPLOYER:
          if (includeResponses) includeResponses = { where: { vacancy: { employerId: req.user.id } } };
          break;
        case UserRole.APPLICANT:
          if (includeResponses) includeResponses = { where: { candidateId: req.user.id } };
          break;
      }
    } else {
      if(includeResponses) throw new HttpError(401, "User must be authorized to see responses")
    }

    const vacancy = await prisma.vacancy.findUnique({
      where: where!,
      include: {
        employer: include?.includes("employer"),
        responses: includeResponses,
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
