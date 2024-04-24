import { injectable } from "tsyringe";
import {
  Body,
  Controller, Delete,
  Get, Middlewares, Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags, UploadedFile,
} from "tsoa";
import {
  BasicGuestVacancyResponse,
  CreateGuestVacancyResponseRequest,
  CreateGuestVacancyResponseRequestSchema,
  CreateQueuedWithOcrGuestVacancyResponseResponse,
  GetGuestVacancyResponseResponse, PatchGuestVacancyResponseQueuedWithOcrRequest,
  PatchGuestVacancyResponseQueuedWithOcrRequestSchema,
  PatchGuestVacancyResponseRequest,
  PatchGuestVacancyResponseRequestSchema,
} from "./guest-response.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, PUBLIC_SCOPE, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { VacancyResponseStatus, VacancyStatus } from "@prisma/client";
import { Prisma } from "@prisma/client"
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";
import { parseSortBy } from "../../../infrastructure/controller/sort/sort.dto";
import { GuestResponseService } from "./guest-response.service";
import { artifactConfig, FILE_EXTENSION_MIME_TYPES } from "../../../external/artifact/artifact.config";
import { ArtifactService } from "../../../external/artifact/artifact.service";
import { routeRateLimit as rateLimit } from "../../../infrastructure/rate-limiter/rate-limiter.middleware";


@injectable()
@Route("api/v1/guestVacancyResponses")
@Tags("Guest Vacancy Response")
export class GuestVacancyResponseController extends Controller {
  constructor(
    private readonly artifactService: ArtifactService,
    private readonly guestResponseService: GuestResponseService,
  ) {
    super();
  }

  @Post("queuedWithOcr")
  @Middlewares(rateLimit({limit: 4, interval: 3600 * 24}))
  @Response<HttpErrorBody & {"error": "Vacancy does not exist"}>(404)
  @Response<HttpErrorBody & {"error":
      | "Vacancy is unpublished or hidden"
      | "Applicant resume is unfilled or does not exist"
  }>(409)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async createQueuedWithOcr(
    @Request() req: JwtModel,
    @UploadedFile("file") multerFile: Express.Multer.File,
    @Query() vacancyId: string,
  ): Promise<CreateQueuedWithOcrGuestVacancyResponseResponse> {
    await this.artifactService.validateFileAttributes(multerFile, [FILE_EXTENSION_MIME_TYPES[".pdf"]], artifactConfig. MAX_DOCUMENT_FILE_SIZE);
    await this.guestResponseService.validateVacancyBeforeCreation(vacancyId);

    const { id } = await this.guestResponseService.enqueueCreationWithOcr(multerFile, vacancyId);
    return { jobId: id! }
  }

  @Patch("queuedWithOcr/{jobId}/resume")
  @Middlewares(rateLimit({limit: 100, interval: 3600 * 24}))
  @Response<HttpErrorBody & {"error": "Job not found"}>(404)
  public async patchQueuedWithOcrById(
    @Request() req: JwtModel,
    @Path() jobId: string,
    @Body() body: PatchGuestVacancyResponseQueuedWithOcrRequest,
  ) {
    body = PatchGuestVacancyResponseQueuedWithOcrRequestSchema.validateSync(body)

    const job = await this.guestResponseService.getQueuedWithOcrJob(jobId);
    if (!job) throw new HttpError(404, "Job not found");

    await this.guestResponseService.patchQueuedWithOcrJob(job, body);
  }

  @Get("queuedWithOcr/{jobId}")
  @Middlewares(rateLimit({limit: 1200, interval: 3600 * 24}))
  @Response<HttpErrorBody & {"error": "Job not found"}>(404)
  public async getQueuedWithOcrById(
    @Request() req: JwtModel,
    @Path() jobId: string,
  ) {
    const job = await this.guestResponseService.getQueuedWithOcrJob(jobId);

    if (!job) throw new HttpError(404, "Job not found");

    return job;
  }

  @Post("")
  @Response<HttpErrorBody & {"error": "Vacancy does not exist"}>(404)
  @Response<HttpErrorBody & {"error":
      | "Vacancy is unpublished or hidden"
      | "Applicant resume is unfilled or does not exist"
  }>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateGuestVacancyResponseRequest,
  ): Promise<BasicGuestVacancyResponse> {
    body = CreateGuestVacancyResponseRequestSchema.validateSync(body);

    await this.guestResponseService.validateVacancyBeforeCreation(body.vacancyId);
    const { resume, ...bodyData} = body;
    await this.guestResponseService.validateResumeBeforeCreation(resume);


    return prisma.guestVacancyResponse.create({
      data: {
        ...bodyData,
        resume,
      },
    });
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

    const [guestVacancyResponses, guestVacancyResponsesCount] = await Promise.all([
      prisma.guestVacancyResponse.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        orderBy: parseSortBy<Prisma.GuestVacancyResponseOrderByWithRelationInput>(sortBy),
        include: {
          vacancy: include?.includes("vacancy.employer")
            ? { include: { employer: true } }
            : include?.includes("vacancy"),
        },
      }),
      prisma.guestVacancyResponse.count({ where: where! }),
    ]);

    return new PageResponse(guestVacancyResponses, page, size, guestVacancyResponsesCount);
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponse not found"}>(404)
  public async getById(
    @Request() req: JwtModel | { user: undefined },
    @Path() id: string,
    @Query() include?: ("vacancy")[]
  ): Promise<GetGuestVacancyResponseResponse> {
    let where = null;

    if(req.user) {
      switch (req.user.role) {
        case UserRole.APPLICANT:
          where = {
            id,
            vacancy: {
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
    } else {
      where = {
        id,
        vacancy: {
          isHidden: false,
          status: { equals: VacancyStatus.PUBLISHED },
        },
      };
    }

    const guestVacancyResponse = await prisma.guestVacancyResponse.findUnique({
      where: where!,
      include: {
        vacancy: include?.includes("vacancy"),
      },
    });

    if(!guestVacancyResponse) throw new HttpError(404, "GuestVacancyResponse not found");
    return guestVacancyResponse;
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "GuestVacancyResponse not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchGuestVacancyResponseRequest,
  ): Promise<BasicGuestVacancyResponse> {
    body = PatchGuestVacancyResponseRequestSchema.validateSync(body)

    const where = {
      id,
      ...(req.user.role === UserRole.EMPLOYER && { vacancy: { employerId: req.user.id } }),
    }

    const guestVacancyResponse = await prisma.guestVacancyResponse.findUnique({
      where: where,
      select: {
        vacancy: {
          select: {
            employerId: true,
          },
        },
      },
    });

    if(!guestVacancyResponse) throw new HttpError(404, "GuestVacancyResponse not found");

    return prisma.guestVacancyResponse.update({
      where: where,
      data: body,
    });
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "GuestVacancyResponse not found"}>(404)
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const where: Prisma.GuestVacancyResponseWhereUniqueInput = {
      id,
      ...(req.user.role === UserRole.EMPLOYER && { vacancy: { employerId: req.user.id } }),
    }

    if(!await prisma.guestVacancyResponse.exists(where)) throw new HttpError(404, "VacancyResponse not found");

    await prisma.guestVacancyResponse.delete({ where });
  }
}