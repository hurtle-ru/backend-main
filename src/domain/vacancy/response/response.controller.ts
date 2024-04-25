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
  BasicVacancyResponse,
  CreateVacancyResponseRequestFromApplicant,
  CreateVacancyResponseRequestFromApplicantSchema,
  CreateVacancyResponseRequestFromManager,
  CreateVacancyResponseRequestFromManagerSchema,
  GetVacancyResponseResponse,
  PatchVacancyResponseRequest,
  PatchVacancyResponseRequestSchema,
  GetVacancyResponsesCountResponse,
} from "./response.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";
import { Prisma, VacancyResponseStatus, VacancyStatus } from "@prisma/client";
import { publicCacheMiddleware } from "../../../infrastructure/cache/public-cache.middleware";
import { GetAllVacancyCitiesResponse } from "../vacancy.dto";
import { parseSortBy } from "../../../infrastructure/controller/sort/sort.dto";
import {
  validateSyncByAtLeastOneSchema,
} from "../../../infrastructure/validation/requests/utils.yup";


@injectable()
@Route("api/v1/vacancyResponses")
@Tags("Vacancy Response")
export class VacancyResponseController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error":
      | "Invalid body request for applicant"
      | "Invalid body request for manager"
  }>(403)
  @Response<HttpErrorBody & {"error": "Vacancy does not exist"}>(404)
  @Response<HttpErrorBody & {"error":
      | "This applicant already has response on this vacancy"
      | "Applicant resume is unfilled or does not exist"
      | "Vacancy is unpublished or hidden"
  }>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateVacancyResponseRequestFromApplicant | CreateVacancyResponseRequestFromManager,
  ): Promise<BasicVacancyResponse> {
    body = validateSyncByAtLeastOneSchema(
      [
        CreateVacancyResponseRequestFromApplicantSchema,
        CreateVacancyResponseRequestFromManagerSchema,
      ],
      body,
    );

    const { _requester, ...bodyData } = body;
    if (req.user.role === UserRole.APPLICANT && _requester !== UserRole.APPLICANT) throw new HttpError(403, "Invalid body request for applicant");
    if (req.user.role === UserRole.MANAGER && _requester !== UserRole.MANAGER) throw new HttpError(403, "Invalid body request for manager");

    const candidateId = req.user.role === UserRole.APPLICANT
      ? req.user.id
      : (bodyData as CreateVacancyResponseRequestFromManager).candidateId;

    const vacancy = await prisma.vacancy.findUnique({ where: { id: bodyData.vacancyId }});
    if (!vacancy)
      throw new HttpError(404, "Vacancy does not exist");

    if (vacancy.status !== VacancyStatus.PUBLISHED || vacancy.isHidden) {
      throw new HttpError(409, "Vacancy is unpublished or hidden");
    }

    if (await prisma.vacancyResponse.exists({ candidateId, vacancyId: bodyData.vacancyId }))
      throw new HttpError(409, "This applicant already has response on this vacancy");

    const candidateResume = await prisma.resume.findUnique({
      where: { applicantId: candidateId },
      include: {
        contacts: true,
        certificates: true,
        education: true,
        experience: true,
        languages: true,
      },
    });

    if (!candidateResume || !prisma.resume.isFilled(candidateResume))
      throw new HttpError(409, "Applicant resume is unfilled or does not exist");

    return prisma.vacancyResponse.create({
      data: {
        ...bodyData,
        candidateId,
      },
    });
  }

  /*
  * Метод получения всех городов, указанных в откликах на вакансии данного пользователя.
  * Используется краткосрочное кешировние
  */
  @Get("my/cities")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.APPLICANT])
  @Middlewares(publicCacheMiddleware(20 * 60))
  public async getMyCities(@Request() req: JwtModel): Promise<GetAllVacancyCitiesResponse> {
    let citiesAggregation = null;

    if (req.user.role === UserRole.EMPLOYER) {
      citiesAggregation = await prisma.vacancy.groupBy({
        by: ["city"],
        where: {
          employerId: req.user.id,
          responses: {
            some: {},
          },
        },
        _count: {
          city: true,
        },
      });
    } else if (req.user.role === UserRole.APPLICANT) {
      citiesAggregation = await prisma.vacancyResponse.findMany({
        where: {
          candidateId: req.user.id,
        },
        select: {
          vacancy: {
            select: {
              city: true,
            },
          },
        },
      });

      const citiesSet = new Set(citiesAggregation.map((response) => response.vacancy.city));
      citiesAggregation = Array.from(citiesSet).map((city) => ({
        city,
        _count: { city: 1 }, // Mock count since actual counts are irrelevant here
      }));
    }

    const cities = citiesAggregation!
      .filter((aggregation) => aggregation.city) // Ensuring no null cities
      .map((aggregation) => aggregation.city);

    return {
      cities,
      total: cities.length,
    };
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("candidate" | "candidate.resume" | "vacancy" | "vacancy.employer" | "candidateRecommendedBy")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() sortBy?: ("createdAt_asc" | "createdAt_desc" | "isViewedByEmployer_asc" | "isViewedByEmployer_desc")[],
    @Query() status?: VacancyResponseStatus[],
    @Query() candidateId?: string[],
    @Query() candidateRecommendedByManagerId?: string[],
    @Query() vacancyId?: string[],
    @Query() vacancy_city?: string[],
    @Query() vacancy_minSalary?: number,
    @Query() vacancy_maxSalary?: number,
    @Query() candidate_resume_minDesiredSalary?: number,
    @Query() candidate_resume_maxDesiredSalary?: number,
  ): Promise<PageResponse<GetVacancyResponseResponse>> {
    let where: Prisma.VacancyResponseWhereInput = {
      status: { in: status ?? undefined },
      candidateId: { in: candidateId ?? undefined },
      candidateRecommendedByManagerId: { in: candidateRecommendedByManagerId ?? undefined },
      vacancyId: { in: vacancyId ?? undefined },
      vacancy: {
        city: { in: vacancy_city ?? undefined },
        salary: {
          gte: vacancy_minSalary ?? undefined,
          lte: vacancy_maxSalary ?? undefined,
        },
      },
      candidate: {
        resume: {
          desiredSalary: {
            gte: candidate_resume_minDesiredSalary ?? undefined,
            lte: candidate_resume_maxDesiredSalary ?? undefined,
          },
        },
      },
    };

    switch (req.user.role) {
    case UserRole.APPLICANT:
      where = {
        ...where,
        candidateId: req.user.id,
        vacancy:{
          isHidden: false,
          status: { equals: VacancyStatus.PUBLISHED },
        },
      };
      break;
    case UserRole.EMPLOYER:
      where = { ...where, vacancy: { employerId: req.user.id } };
      break;
    }

    const [vacancyResponses, vacancyResponsesCount] = await Promise.all([
      prisma.vacancyResponse.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        orderBy: parseSortBy<Prisma.VacancyResponseOrderByWithRelationInput>(sortBy),
        include: {
          candidateRecommendedBy: include?.includes("candidateRecommendedBy"),
          vacancy: include?.includes("vacancy.employer")
            ? { include: { employer: true } }
            : include?.includes("vacancy"),
          candidate: include?.includes("candidate.resume")
            ? { include: { resume: true }}
            : include?.includes("candidate"),
        },
      }),
      prisma.vacancyResponse.count({ where: where! }),
    ]);

    return new PageResponse(vacancyResponses, page, size, vacancyResponsesCount);
  }

  @Get("count")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Employer not found"}>(404)
  public async getCount(
    @Request() req: JwtModel,
    @Query() employerId: string,
  ): Promise<GetVacancyResponsesCountResponse> {
    const employer = await prisma.employer.exists( { id: employerId } );
    if (!employer) throw new HttpError(404, "Employer not found");

    return prisma.vacancy.findMany({
      where: { employerId },
      select: {
        id: true,
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("candidate" | "vacancy" | "candidateRecommendedBy")[],
  ): Promise<GetVacancyResponseResponse> {
    let where = null;

    switch (req.user.role) {
    case UserRole.APPLICANT:
      where = {
        id,
        candidateId: req.user.id,
        vacancy:{
          isHidden: false,
          status: { equals: VacancyStatus.PUBLISHED },
        },
      };
      break;
    case UserRole.EMPLOYER:
      where = { id, vacancy: { employerId: req.user.id } };
      break;
    case UserRole.MANAGER:
      where = { id };
      break;
    }

    const vacancyResponse = await prisma.vacancyResponse.findUnique({
      where: where!,
      include: {
        vacancy: include?.includes("vacancy"),
        candidate: include?.includes("candidate"),
        candidateRecommendedBy: include?.includes("candidateRecommendedBy"),
      },
    });

    if (!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

    return vacancyResponse;
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchVacancyResponseRequest,
  ): Promise<BasicVacancyResponse> {
    body = PatchVacancyResponseRequestSchema.validateSync(body);

    const where = {
      id,
      ...(req.user.role === UserRole.EMPLOYER && { vacancy: { employerId: req.user.id } }),
    };

    const vacancyResponse = await prisma.vacancyResponse.findUnique({
      where: where,
      select: {
        vacancy: {
          select: {
            employerId: true,
          },
        },
      },
    });

    if (!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

    return prisma.vacancyResponse.update({
      where: where,
      data: body,
    });
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const where: Prisma.VacancyResponseWhereUniqueInput = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { candidateId: req.user.id }),
      ...(req.user.role === UserRole.EMPLOYER && { vacancy: { employerId: req.user.id } }),
    };

    if (!await prisma.vacancyResponse.exists(where)) throw new HttpError(404, "VacancyResponse not found");

    await prisma.vacancyResponse.delete({ where });
  }
}
