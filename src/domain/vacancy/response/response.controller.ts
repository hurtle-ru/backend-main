import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
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
  CreateVacancyResponseRequestFromManager,
  GetVacancyResponseResponse,
  PutVacancyResponseRequest,
} from "./response.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";


@injectable()
@Route("api/v1/vacancyResponses")
@Tags("Vacancy Response")
export class VacancyResponseController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Invalid body request for applicant" | "Invalid body request for manager"}>(403)
  @Response<HttpErrorBody & {"error": "Vacancy does not exist"}>(404)
  @Response<HttpErrorBody & {"error": "This applicant already has response on this vacancy"}>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateVacancyResponseRequestFromApplicant | CreateVacancyResponseRequestFromManager,
  ): Promise<BasicVacancyResponse> {
    const { _requester, ...bodyData } = body;
    if(req.user.role === UserRole.APPLICANT && _requester !== UserRole.APPLICANT) throw new HttpError(403, "Invalid body request for applicant");
    if(req.user.role === UserRole.MANAGER && _requester !== UserRole.MANAGER) throw new HttpError(403, "Invalid body request for manager");

    const candidateId = req.user.role === UserRole.APPLICANT
      ? req.user.id
      : (bodyData as CreateVacancyResponseRequestFromManager).candidateId;

    if(await prisma.vacancy.exists({ id: bodyData.vacancyId }))
      throw new HttpError(404, "Vacancy does not exist");

    if(await prisma.vacancyResponse.exists({ candidateId, vacancyId: bodyData.vacancyId }))
      throw new HttpError(409, "This applicant already has response on this vacancy");

    return prisma.vacancyResponse.create({
      data: {
        ...bodyData,
        candidateId,
      },
    })
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("candidate" | "vacancy" | "candidateRecommendedBy")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetVacancyResponseResponse>> {
    let where = null;

    if (req.user.role === UserRole.APPLICANT) where = { candidateId: req.user.id };
    else if (req.user.role === UserRole.EMPLOYER) where = { vacancy: { employerId: req.user.id } };
    else if (req.user.role === UserRole.MANAGER) where = {};

    const [vacancyResponses, vacancyResponsesCount] = await Promise.all([
      prisma.vacancyResponse.findMany({
        skip: (page - 1) * size,
        take: size,
        where: where!,
        include: {
          candidate: include?.includes("candidate"),
          vacancy: include?.includes("vacancy"),
          candidateRecommendedBy: include?.includes("candidateRecommendedBy"),
        },
      }),
      prisma.vacancyResponse.count({ where: where! }),
    ]);

    return new PageResponse(vacancyResponses, page, size, vacancyResponsesCount);
  }


  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("candidate" | "vacancy" | "candidateRecommendedBy")[]
  ): Promise<GetVacancyResponseResponse> {
    let where = null;

    if(req.user.role === UserRole.APPLICANT) where = { id, candidateId: req.user.id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancy: { employerId: req.user.id } };
    else if(req.user.role === UserRole.MANAGER) where = { id };

    const vacancyResponse = await prisma.vacancyResponse.findUnique({
      where: where!,
      include: {
        vacancy: include?.includes("vacancy"),
        candidate: include?.includes("candidate"),
        candidateRecommendedBy: include?.includes("candidateRecommendedBy"),
      },
    });

    if(!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

    return vacancyResponse
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutVacancyResponseRequest>,
  ): Promise<BasicVacancyResponse> {
    const where = {
      id,
      ...(req.user.role === UserRole.EMPLOYER && { vacancy: { employerId: req.user.id } }),
    }

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

    if(!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

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
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { vacancy: { candidateId: req.user.id } }),
      ...(req.user.role === UserRole.EMPLOYER && { vacancy: { employerId: req.user.id } }),
    }

    if(!await prisma.vacancyResponse.exists(where)) throw new HttpError(404, "VacancyResponse not found");

    await prisma.vacancyResponse.delete({ where: { id } });
  }
}
