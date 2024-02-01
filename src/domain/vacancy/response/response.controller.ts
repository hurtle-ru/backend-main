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
  CreateVacancyResponseByManagerRequest,
  GetVacancyResponseResponse,
  PatchVacancyResponseRequest,
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

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("candidate" | "vacancy" | "candidateRecommendedBy")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetVacancyResponseResponse>> {
    let where = {}

    if (req.user.role === UserRole.APPLICANT)     where = { applicantId: req.user.id }
    else if (req.user.role === UserRole.EMPLOYER) where = { vacancy: { employerId: req.user.id } }
    else if (req.user.role === UserRole.MANAGER)  where = { suggestedByManagerId: req.user.id }

    const [vacancyResponses, vacancyResponsesCount] = await Promise.all([
      prisma.vacancyResponse.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          candidate: include?.includes("candidate"),
          vacancy: include?.includes("vacancy"),
          candidateRecommendedBy: include?.includes("candidateRecommendedBy"),
        },
      }),
      prisma.vacancyResponse.count({ where }),
    ]);
    console.log("VacancyResponses", vacancyResponses)

    return new PageResponse(vacancyResponses, page, size, vacancyResponsesCount);
  }


  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("candidate" | "vacancy" | "candidateRecommendedBy")[]
  ): Promise<GetVacancyResponseResponse> {
    let where = null;

    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancy: {employerId: req.user.id } };
    else if(req.user.role === UserRole.APPLICANT) where = { id, candidateId: req.user.id };

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

  @Post("{id}")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "You are already response on this vacancy"}>(409)
  public async suggestByApplicant(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<BasicVacancyResponse> {
    if (await prisma.vacancyResponse.findFirst({where: {candidateId: req.user.id, vacancyId: id}})) {
      throw new HttpError(409, "You are already response on this vacancy")
    }

    return prisma.vacancyResponse.create({
      data: {
        candidateId: req.user.id,
        vacancyId: id,
      },
    })
  }

  @Post("{id}/byManager")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "You are already response on this vacancy"}>(409)
  public async suggestByManager(
    @Path() id: string,
    @Request() req: JwtModel,
    @Body() body: CreateVacancyResponseByManagerRequest,
  ): Promise<BasicVacancyResponse> {
    if (await prisma.vacancyResponse.findFirst({where: {candidateId: body.candidateId, vacancyId: id}})) {
      throw new HttpError(409, "You are already response on this vacancy")
    }

    return prisma.vacancyResponse.create({
      data: {
        ...body,
        vacancyId: id,
      },
    })
  };

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another response"}>(403)
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PatchVacancyResponseRequest>,
  ): Promise<BasicVacancyResponse> {

    const vacancyResponse = await prisma.vacancyResponse.findUnique( {where: { id }, include: { vacancy: true } } );
    if(!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

    if (req.user.role === UserRole.EMPLOYER && vacancyResponse.vacancy.employerId !== req.user.id) {
      throw new HttpError(403, "Not enough rights to edit another response");
    }

    return prisma.vacancyResponse.update({
      where: { id },
      data: body,
    });
  }


  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another response"}>(403)
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const vacancyResponse = await prisma.vacancyResponse.findUnique( { where: { id }, include: { vacancy: true } } );
    if(!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

    if (
      req.user.role === UserRole.APPLICANT && vacancyResponse.candidateId !== req.user.id
      || req.user.role === UserRole.EMPLOYER && vacancyResponse.vacancy.employerId !== req.user.id
      ) {
      throw new HttpError(403, "Not enough rights to edit another response");
    }

    await prisma.vacancyResponse.delete({where: { id }});
  }
}
