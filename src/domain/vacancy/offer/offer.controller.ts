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
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { BasicOffer, CreateOfferRequest, CreateOfferRequestSchema, GetOfferResponse, PatchOfferRequest, PatchOfferRequestSchema } from "./offer.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { OfferStatus, VacancyResponseStatus } from "@prisma/client";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";


@injectable()
@Route("api/v1/offers")
@Tags("Offer")
export class OfferController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "VacancyResponse not found"}>(404)
  @Response<HttpErrorBody & {"error": "VacancyResponse already has offer"}>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateOfferRequest,
  ): Promise<BasicOffer> {
    body = CreateOfferRequestSchema.validateSync(body)

    const where = { id: body.vacancyResponseId, vacancy: { employerId: req.user.id } };

    const vacancyResponse = await prisma.vacancyResponse.findUnique({
      where,
      select: {
        offer: {
          select: {
            id: true,
          },
        },
      },
    });

    if(!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");
    if(vacancyResponse.offer) throw new HttpError(409, "VacancyResponse already has offer");

    const offer = await prisma.offer.create({
      data: {
        ...body,
        status: OfferStatus.PENDING,
      },
    });

    await prisma.vacancyResponse.update({
      where,
      data: {
        status: VacancyResponseStatus.OFFER_MADE,
      },
    })

    return offer;
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("vacancyResponse" | "vacancyResponse.vacancy" | "vacancyResponse.vacancy.employer")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetOfferResponse>> {
    let where;
    if(req.user.role === UserRole.APPLICANT) where = { vacancyResponse: { candidateId: req.user.id } };
    else if(req.user.role === UserRole.EMPLOYER) where = { vacancyResponse: { vacancy: { employerId: req.user.id } } };

    const [offers, offersCount] = await Promise.all([
      prisma.offer.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          vacancyResponse: include?.includes("vacancyResponse.vacancy") || include?.includes("vacancyResponse.vacancy.employer")
          ? {
            include: {
              vacancy: include?.includes("vacancyResponse.vacancy.employer")
              ? { include: { employer: true } }
              : include?.includes("vacancyResponse.vacancy")
            }
          }
          : include?.includes("vacancyResponse"),
        },
      }),
      prisma.offer.count({ where }),
    ]);

    return new PageResponse(offers, page, size, offersCount);
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Query() include?: ("vacancyResponse" | "vacancyResponse.vacancy")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() vacancyId?: string,
    @Query() vacancyResponseId?: string,
    @Query() employerId?: string,
  ): Promise<PageResponse<GetOfferResponse>> {
    const where = {
      vacancyId: vacancyId ?? undefined,
      vacancyResponseId: vacancyResponseId ?? undefined,
      vacancy: { employerId: employerId ?? undefined },
    }

    const [offers, offersCount] = await Promise.all([
      prisma.offer.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          vacancyResponse: include?.includes("vacancyResponse.vacancy")
          ? { include: { vacancy: true }}
          : include?.includes("vacancyResponse"),
        },
      }),
      prisma.offer.count({ where }),
    ]);

    return new PageResponse(offers, page, size, offersCount);
  }

  @Put("{id}/status")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async putStatus(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: { status: OfferStatus },
  ): Promise<BasicOffer> {
    const offer = await prisma.offer.findUnique({
      where: { id, vacancyResponse: { candidateId: req.user.id } },
    });

    if(!offer) throw new HttpError(404, "Offer not found");

    return prisma.offer.update({
      where: { id },
      data: { ...body },
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchOfferRequest,
  ): Promise<BasicOffer> {
    PatchOfferRequestSchema.validateSync(body)

    let where = null;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancyResponse: { vacancy: { employerId: req.user.id} } };

    const offer = await prisma.offer.findUnique({
      where: where!,
    });

    if(!offer) throw new HttpError(404, "Offer not found");

    return prisma.offer.update({
      where: where!,
      data: body,
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("vacancyResponse" | "vacancyResponse.vacancy")[],
  ): Promise<GetOfferResponse> {
    let where = null;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancyResponse: { vacancy: { employerId: req.user.id } } };
    else if(req.user.role === UserRole.APPLICANT) where = { id, vacancyResponse: { candidateId: req.user.id } };

    const offer = await prisma.offer.findUnique({
      where: where!,
      include: {
        vacancyResponse: include?.includes("vacancyResponse.vacancy")
        ? { include: { vacancy: true }}
        : include?.includes("vacancyResponse"),
      },
    });

    if(!offer) throw new HttpError(404, "Offer not found");

    return offer;
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ) {
    let where = null;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancyResponse: { vacancy: { employerId: req.user.id } } };

    const offer = await prisma.offer.findUnique({ where: where! });
    if(!offer) throw new HttpError(404, "Offer not found");

    await prisma.offer.delete({ where: where! });
  }
}