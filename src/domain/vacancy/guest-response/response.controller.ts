import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Get,
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
  BasicGuestVacancyResponse,
  CreateGuestVacancyResponseRequest,
  CreateGuestVacancyResponseRequestSchema,
  GetGuestVacancyResponseResponse,
} from "./response.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { VacancyResponseStatus, VacancyStatus } from "@prisma/client";
import { Prisma } from "@prisma/client"
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";
import { parseSortBy } from "../../../infrastructure/controller/sort/sort.dto";


@injectable()
@Route("api/v1/guestVacancyResponses")
@Tags("Guest Vacancy Response")
export class GuestVacancyResponseController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Response<HttpErrorBody & {"error": "Vacancy does not exist"}>(404)
  @Response<HttpErrorBody & {"error": "Vacancy is unpublished or hidden" | "Resume is unfilled or does not exist"}>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateGuestVacancyResponseRequest,
  ): Promise<BasicGuestVacancyResponse> {
    CreateGuestVacancyResponseRequestSchema.validateSync(body)

    const vacancy = await prisma.vacancy.findUnique({ where: { id: body.vacancyId }})
    if(!vacancy)
      throw new HttpError(404, "Vacancy does not exist");

    if (vacancy.status !== VacancyStatus.PUBLISHED || vacancy.isHidden) {
      throw new HttpError(409, "Vacancy is unpublished or hidden");
    }

    let {resume, vacancyId, ...bodyData} = body

    return prisma.guestVacancyResponse.create({
      data: {
        ...bodyData,
        vacancy: {
          connect: {
            id: body.vacancyId
          }
        },
        resume: resume !== null ? resume: Prisma.JsonNull
      },
    })
  }

  @Get("my")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("vacancy" | "vacancy.employer")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() sortBy?: ("createdAt_asc" | "createdAt_desc" | "isViewedByEmployer_asc" | "isViewedByEmployer_desc")[],
    @Query() status?: VacancyResponseStatus[],
    @Query() vacancyId?: string[],
    @Query() vacancy_city?: string[],
    @Query() vacancy_minSalary?: number,
    @Query() vacancy_maxSalary?: number,
    @Query() candidate_resume_minDesiredSalary?: number,
    @Query() candidate_resume_maxDesiredSalary?: number,
  ): Promise<PageResponse<GetGuestVacancyResponseResponse>> {
    let where: Prisma.GuestVacancyResponseWhereInput = {
      status: { in: status ?? undefined },
      vacancyId: { in: vacancyId ?? undefined },
      vacancy: {
        city: { in: vacancy_city ?? undefined },
        salary: {
          gte: vacancy_minSalary ?? undefined,
          lte: vacancy_maxSalary ?? undefined,
        },
      },
      resume: (candidate_resume_minDesiredSalary || candidate_resume_maxDesiredSalary) ? {
        path: ["desiredSalary"],
        gte: candidate_resume_minDesiredSalary ?? undefined,
        lte: candidate_resume_maxDesiredSalary ?? undefined,
      }: undefined,
    }
    if (req.user.role === UserRole.EMPLOYER){
      where = { ...where, vacancy: { employerId: req.user.id } };
    }

    const [vacancyResponses, vacancyResponsesCount] = await Promise.all([
      prisma.guestVacancyResponse.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        orderBy: parseSortBy<Prisma.VacancyResponseOrderByWithRelationInput>(sortBy),
        include: {
          vacancy: include?.includes("vacancy.employer")
            ? { include: { employer: true } }
            : include?.includes("vacancy"),
        },
      }),
      prisma.guestVacancyResponse.count({ where: where! }),
    ]);

    return new PageResponse(vacancyResponses, page, size, vacancyResponsesCount);
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponse not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("vacancy")[]
  ): Promise<GetGuestVacancyResponseResponse> {
    let where = null;

    switch (req.user.role) {
      case UserRole.APPLICANT:
        where = {
          id,
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

    const guestVacancyResponse = await prisma.guestVacancyResponse.findUnique({
      where: where!,
      include: {
        vacancy: include?.includes("vacancy"),
      },
    });

    if(!guestVacancyResponse) throw new HttpError(404, "guestVacancyResponse not found");

    return guestVacancyResponse
  }
};
