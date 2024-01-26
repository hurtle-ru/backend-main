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
  BasicCandidate,
  PatchCandidateRequest,
  GetCandidateResponse,
  CreateCandidateByManagerRequest
} from "./candidate.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";

@injectable()
@Route("api/v1/vacancies/candidates")
@Tags("Candidate")
export class CandidateController extends Controller {
  constructor() {
    super();
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("applicant" | "vacancy" | "suggestedManager")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetCandidateResponse>> {
    let where = {}

    if (req.user.role === UserRole.APPLICANT)     where = { applicantId: req.user.id }
    else if (req.user.role === UserRole.EMPLOYER) where = { vacancy: { employerId: req.user.id } }
    else if (req.user.role === UserRole.MANAGER)  where = { suggestedByManagerId: req.user.id }

    const [candidates, candidatesCount] = await Promise.all([
      prisma.candidate.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          applicant: include?.includes("applicant"),
          vacancy: include?.includes("vacancy"),
          suggestedBy: include?.includes("suggestedManager"),
        },
      }),
      prisma.candidate.count({ where }),
    ]);
    console.log("Candidates", candidates)

    return new PageResponse(candidates, page, size, candidatesCount);
  }


  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Candidate not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("applicant" | "vacancy" | "suggestedManager")[]
  ): Promise<GetCandidateResponse> {
    let where = null;

    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancy: {employerId: req.user.id } };
    else if(req.user.role === UserRole.APPLICANT) where = { id, applicantId: req.user.id };

    const candidate = await prisma.candidate.findUnique({
      where: where!,
      include: {
        vacancy: include?.includes("vacancy"),
        applicant: include?.includes("applicant"),
        suggestedBy: include?.includes("suggestedManager"),
      },
    });

    if(!candidate) throw new HttpError(404, "Candidate not found");

    return candidate
  }

  @Post("{id}")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "You are already candidate on this vacancy"}>(409)
  public async suggestByApplicant(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<BasicCandidate> {
    if (await prisma.candidate.findFirst({where: {applicantId: req.user.id, vacancyId: id}})) {
      throw new HttpError(409, "You are already candidate on this vacancy")
    }

    return prisma.candidate.create({
      data: {
        applicantId: req.user.id,
        vacancyId: id,
      },
    })
  }

  @Post("{id}/byManager")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "You are already candidate on this vacancy"}>(409)
  public async suggestByManager(
    @Path() id: string,
    @Request() req: JwtModel,
    @Body() body: CreateCandidateByManagerRequest,
  ): Promise<BasicCandidate> {
    if (await prisma.candidate.findFirst({where: {applicantId: body.applicantId, vacancyId: id}})) {
      throw new HttpError(409, "You are already candidate on this vacancy")
    }

    return prisma.candidate.create({
      data: {
        ...body,
        vacancyId: id,
      },
    })
  };

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another candidate"}>(403)
  @Response<HttpErrorBody & {"error": "Candidate not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PatchCandidateRequest>,
  ): Promise<BasicCandidate> {

    const candidate = await prisma.candidate.findUnique( {where: { id }, include: { vacancy: true } } );
    if(!candidate) throw new HttpError(404, "Candidate not found");

    if (req.user.role === UserRole.EMPLOYER && candidate.vacancy.employerId !== req.user.id) {
      throw new HttpError(403, "Not enough rights to edit another candidate");
    }

    return prisma.candidate.update({
      where: { id },
      data: body,
    });
  }


  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another candidate"}>(403)
  @Response<HttpErrorBody & {"error": "Candidate not found"}>(404)
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const candidate = await prisma.candidate.findUnique( { where: { id }, include: { vacancy: true } } );
    if(!candidate) throw new HttpError(404, "Candidate not found");

    if (
      req.user.role === UserRole.APPLICANT && candidate.applicantId !== req.user.id
      || req.user.role === UserRole.EMPLOYER && candidate.vacancy.employerId !== req.user.id
      ) {
      throw new HttpError(403, "Not enough rights to edit another candidate");
    }

    await prisma.candidate.delete({where: { id }});
  }
}
