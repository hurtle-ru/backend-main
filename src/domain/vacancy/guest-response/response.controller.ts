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
  BasicGuestVacancyResponse,
  CreateGuestVacancyResponseRequest,
  CreateGuestVacancyResponseRequestSchema,
  GetGuestVacancyResponseResponse,
} from "./response.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { VacancyStatus } from "@prisma/client";
import { GetResumeResponse } from "../../resume/resume.dto";


@injectable()
@Route("api/v1/guestVacancyResponses")
@Tags("Guest Vacancy Response")
export class GuestVacancyResponseController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Response<HttpErrorBody & {"error": "Vacancy does not exist"}>(404)
  @Response<HttpErrorBody & {"error": "Vacancy is unpublished or hidden"}>(409)
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

    if ( !prisma.resume.isFilled(body.resume) )
      throw new HttpError(409, "Applicant resume is unfilled or does not exist");

    return prisma.guestVacancyResponse.create({
      data: body,
    })
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
}
