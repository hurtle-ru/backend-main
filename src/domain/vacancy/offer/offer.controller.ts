import { injectable } from "tsyringe";
import { Body, Controller, Get, Patch, Path, Post, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { BasicOffer, CreateOfferRequest, GetOfferResponse, PutOfferRequest } from "./offer.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { OfferStatus } from "@prisma/client";
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
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateOfferRequest,
  ): Promise<BasicOffer> {

    const vacancyResponse = await prisma.vacancyResponse.findUnique({
      where: { id: body.vacancyResponseId, vacancy: { employerId: req.user.id} },
    });

    if(!vacancyResponse) throw new HttpError(404, "VacancyResponse not found");

    return prisma.offer.create({
      data: {
        ...body,
        status: OfferStatus.PENDING,
      },
    });
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() include?: ("vacancyResponse.vacancy" | "vacancyResponse")[],
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<GetOfferResponse>> {
    let where;
    if(req.user.role === UserRole.APPLICANT) where = { vacancyResponseId: req.user.id };
    else if(req.user.role === UserRole.EMPLOYER) where = { vacancyResponse: {vacancy: {employerId: req.user.id} } };

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

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Query() include?: ("vacancyResponse.vacancy" | "vacancyResponse")[],
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

  @Put("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async putById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PutOfferRequest,
  ): Promise<BasicOffer> {
    let where = null;
    if (req.user.role === UserRole.MANAGER) where = { id };
    else if (req.user.role === UserRole.EMPLOYER) where = { id, vacancyResponse: {vacancy: {employerId: req.user.id} } };

    const offer = await prisma.offer.findUnique({
      where: where!,
    });

    if (!offer) throw new HttpError(404, "Offer not found");

    return prisma.offer.update({
      where: where!,
      data: body,
    });
  }

  @Put("{id}/status")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async putStatus(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() status: OfferStatus,
  ): Promise<BasicOffer> {
    const offer = await prisma.offer.findUnique({
      where: { id, vacancyResponseId: req.user.id },
    });

    if(!offer) throw new HttpError(404, "Offer not found");

    return prisma.offer.update({
      where: { id },
      data: { status },
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Offer not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutOfferRequest>,
  ): Promise<BasicOffer> {
    let where = null;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancyResponse: {vacancy: {employerId: req.user.id} } };

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
    else if(req.user.role === UserRole.EMPLOYER) where = { id, vacancyResponse: {vacancy: {employerId: req.user.id} } };
    else if(req.user.role === UserRole.APPLICANT) where = { id, vacancyResponseId: req.user.id };

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
}