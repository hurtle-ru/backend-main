import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get, Middlewares,
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
import {
  BasicVacancy,
  CreateVacancyRequest, CreateVacancyRequestSchema, GetAllVacancyCitiesResponse,
  GetVacancyResponse,
  PatchVacancyRequestFromEmployer,
  PatchVacancyRequestFromEmployerSchema,
  PatchVacancyRequestFromManager,
  PatchVacancyRequestFromManagerSchema,
} from "./vacancy.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { JwtModel, PUBLIC_SCOPE, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import {
  Currency,
  Prisma,
  VacancyEmploymentType, VacancyExperience,
  VacancyReportingForm, VacancyResponseModerationStatus, VacancyStatus, VacancyTeamRole,
  VacancyWorkingHours,
  VacancyWorkplaceModel,
} from "@prisma/client";
import { IntFilterString, parseIntFilterQueryParam } from "../../infrastructure/controller/filter/number-filter.dto";
import { publicCacheMiddleware } from "../../infrastructure/cache/public-cache.middleware";
import { Request as ExpressRequest } from "express";
import { getIp } from "../../infrastructure/controller/express-request/express-request.utils";
import { VacancyService } from "./vacancy.service";

import { validateSyncByAtLeastOneSchema } from "../../infrastructure/validation/requests/utils.yup";
import { SearchQuery } from "../../infrastructure/controller/search/search.dto";


@injectable()
@Route("api/v1/vacancies")
@Tags("Vacancy")
export class VacancyController extends Controller {
  constructor(
    private readonly vacancyService: VacancyService,
  ) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.EMPLOYER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateVacancyRequest,
  ): Promise<BasicVacancy> {
    body = CreateVacancyRequestSchema.validateSync(body);

    const vacancy = await prisma.vacancy.create({
      data: {
        ...body,
        employer: {
          connect: {
            id: req.user.id,
          },
        },
      },
      include: {
        employer: true,
      },
    });

    await this.vacancyService.sendVacancyCreatedToAdminGroup(vacancy, vacancy.employer);

    return vacancy;
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER, UserRole.APPLICANT, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "User must be authorized to see vacancy responses"}>(401)
  public async getAll(
    @Request() req: JwtModel | { user: null },
    @Query() include?: ("employer" | "responses" | "guestResponses")[],
    @Query() search?: SearchQuery,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
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
    @Query() status?: VacancyStatus,
    @Query() employer_isStartup?: boolean,
    @Query() isHidden?: boolean,
  ): Promise<PageResponse<GetVacancyResponse>> {
    const salary = parseIntFilterQueryParam(salaryFilter);

    let where: Prisma.VacancyWhereInput = {};
    let includeResponses: boolean | Prisma.Vacancy$responsesArgs | null = include?.includes("responses") ?? false;
    let includeGuestResponses: boolean | Prisma.Vacancy$guestResponsesArgs | null = include?.includes("guestResponses") ?? false;

    const searchInput = search && search.length > 0
      ? this.vacancyService.buildSearchInput(search)
      : undefined;

    if (req.user) {
      switch (req.user.role) {
      case UserRole.APPLICANT:
        if (includeResponses) includeResponses = { where: { candidateId: req.user.id } };
        includeGuestResponses = false;

        status = VacancyStatus.PUBLISHED;
        isHidden = false;
        break;
      }
    } else {
      if (includeResponses || includeGuestResponses) throw new HttpError(401, "User must be authorized to see vacancy responses");
      status = VacancyStatus.PUBLISHED;
      isHidden = false;
    }

    where = {
      ...where,
      ...searchInput,
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
      status: status ?? undefined,
      employer: { isStartup: employer_isStartup ?? undefined },
      isHidden,
    };

    const [vacancies, vacanciesCount] = await Promise.all([
      prisma.vacancy.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        include: {
          employer: include?.includes("employer"),
          responses: includeResponses,
          guestResponses: includeGuestResponses,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.vacancy.count({ where: where! }),
    ]);

    return new PageResponse(
      vacancies.map((vacancy) => {
        const { uniqueViewerApplicantIds, uniqueViewerIps, ...vacancyWithoutViewers } = vacancy;
        return {
          ...vacancyWithoutViewers,
          viewersCount: vacancy.uniqueViewerApplicantIds.length + vacancy.uniqueViewerIps.length,
        };
      }),
      page, size, vacanciesCount,
    );
  }

  @Get("my")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.APPLICANT])
  public async getMy(
    @Request() req: JwtModel<UserRole.EMPLOYER | UserRole.APPLICANT>,
    @Query() include?: ("employer" | "guestResponses" | "responses" | "responses.candidate" | "responses.candidate.resume")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetVacancyResponse>> {
    let where = null;
    let includeResponses: boolean | Prisma.Vacancy$responsesArgs = include?.includes("responses") ?? false;

    let includeGuestResponses: boolean | Prisma.Vacancy$guestResponsesArgs = include?.includes("guestResponses") ?? false;
    includeGuestResponses = includeGuestResponses && {
      "APPLICANT": false,
      "EMPLOYER": {
        where: {
          moderationStatus: VacancyResponseModerationStatus.PUBLISHED,
        },
      },
    }[req.user.role];

    if (req.user.role === UserRole.EMPLOYER) {
      where = { employerId: req.user.id };

      if (include?.includes("responses.candidate")) {
        includeResponses = {
          include: { candidate: true },
        };
      }
      if (include?.includes("responses.candidate.resume")) {
        includeResponses = {
          include: {
            candidate: {
              include: {
                resume: {
                  where: { isVisibleToEmployers: true },
                },
              },
            },
          },
        };
      }
    } else if (req.user.role === UserRole.APPLICANT) {
      where = {
        responses: { some: { candidateId: req.user.id } },
        status: VacancyStatus.PUBLISHED,
        isHidden: false,
      };

      if (includeResponses) {
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
          guestResponses: includeGuestResponses,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.vacancy.count({ where: where! }),
    ]);

    return new PageResponse(
      vacancies.map((vacancy) => {
        const { uniqueViewerApplicantIds, uniqueViewerIps, ...vacancyWithoutViewers } = vacancy;
        return {
          ...vacancyWithoutViewers,
          viewersCount: vacancy.uniqueViewerApplicantIds.length + vacancy.uniqueViewerIps.length,
        };
      }),
      page, size, vacanciesCount,
    );
  }

  /**
   * Метод должен вызываться каждый раз, когда соискатель впервые заходит на страницу вакансии
   * Фронтенд должен локально хранить вакансии (их ID), которые уже были просмотрены соискателем, чтобы не вызывать этот метод повторно
   */
  @Post("{id}/viewed")
  @Security("jwt", [UserRole.APPLICANT, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "Vacancy not found"}>(404)
  @Response<HttpErrorBody & {"error":
      | "Applicant already viewed this vacancy"
      | "Anonymous with this ip already viewed this vacancy"
      | "Vacancy is unpublished or hidden"
  }>(409)
  public async addViewed(
    @Path() id: string,
    @Request() req: ExpressRequest & (JwtModel | { user: null }),
  ): Promise<void> {
    const requestIp = getIp(req);
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
    });

    if (!vacancy) throw new HttpError(404, "Vacancy not found");
    if (vacancy.status !== VacancyStatus.PUBLISHED || vacancy.isHidden) throw new HttpError(409, "Vacancy is unpublished or hidden");

    if (req.user && req.user.role === UserRole.APPLICANT) {
      if (vacancy.uniqueViewerApplicantIds.includes(req.user.id)) throw new HttpError(409, "Applicant already viewed this vacancy");

      await prisma.vacancy.update({
        where: { id },
        data: {
          uniqueViewerApplicantIds: {
            push: req.user.id,
          },
        },
      });
    } else if (requestIp) {
      if (vacancy.uniqueViewerIps.includes(requestIp)) throw new HttpError(409, "Anonymous with this ip already viewed this vacancy");

      await prisma.vacancy.update({
        where: { id },
        data: {
          uniqueViewerIps: {
            push: requestIp,
          },
        },
      });
    }
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

    const cities = citiesAggregation.map((aggregation) => aggregation.city);

    return {
      cities,
      total: cities.length,
    };
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
    body = validateSyncByAtLeastOneSchema(
      [
        PatchVacancyRequestFromManagerSchema,
        PatchVacancyRequestFromEmployerSchema,
      ],
      body,
    );

    const { _requester, ...bodyData } = body;
    if (req.user.role === UserRole.EMPLOYER && _requester !== UserRole.EMPLOYER) throw new HttpError(403, "Invalid body request for employer");
    if (req.user.role === UserRole.MANAGER && _requester !== UserRole.MANAGER) throw new HttpError(403, "Invalid body request for manager");

    const where = {
      id,
      ...(req.user.role === UserRole.EMPLOYER && { employerId: req.user.id }),
    };

    const vacancy = await prisma.vacancy.findUnique({ where });
    if (!vacancy) throw new HttpError(404, "Vacancy not found");

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
    @Query() include?: ("employer" | "guestResponses" | "responses" | "responses.candidate")[],
  ): Promise<GetVacancyResponse> {
    let includeResponses: boolean | Prisma.Vacancy$responsesArgs = include?.includes("responses") ?? false;
    let includeGuestResponses: boolean | Prisma.Vacancy$guestResponsesArgs = include?.includes("guestResponses") ?? false;
    let where: Prisma.VacancyWhereUniqueInput = { id };

    if (req.user) {
      switch (req.user.role) {
      case UserRole.APPLICANT:
        if (includeResponses) includeResponses = { where: { candidateId: req.user.id } };
        where = {
          ...where,
          status: VacancyStatus.PUBLISHED,
          isHidden: false,
        };
        includeGuestResponses = false;
        break;
      case UserRole.EMPLOYER:
        if (includeResponses) includeResponses = { where: { vacancy: { employerId: req.user.id } } };
        break;
      case UserRole.MANAGER:
        if (include?.includes("responses.candidate")) includeResponses = { include: { candidate: true } };
        break;
      }
    } else {
      if (includeResponses || includeGuestResponses) throw new HttpError(401, "User must be authorized to see responses");
    }

    const vacancy = await prisma.vacancy.findUnique({
      where: where!,
      include: {
        employer: include?.includes("employer"),
        responses: includeResponses,
        guestResponses: includeGuestResponses,
      },
    });

    if (!vacancy) throw new HttpError(404, "Vacancy not found");

    const { uniqueViewerApplicantIds, uniqueViewerIps, ...vacancyWithoutViewers } = vacancy;
    return {
      ...vacancyWithoutViewers,
      viewersCount: vacancy.uniqueViewerApplicantIds.length + vacancy.uniqueViewerIps.length,
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
    const vacancy = await prisma.vacancy.findUnique({ where: { id } });
    if (!vacancy) throw new HttpError(404, "Vacancy not found");

    if (req.user.id !== vacancy.employerId && req.user.role !== UserRole.MANAGER) {
      throw new HttpError(403, "Not enough rights to edit another vacancy");
    }

    await prisma.vacancy.delete({ where: { id } });
  }
}
