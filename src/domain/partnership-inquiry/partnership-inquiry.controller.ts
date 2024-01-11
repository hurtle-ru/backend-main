import { Body, Controller, Get, Path, Post, Put, Query, Response, Route, Security, Tags } from "tsoa";
import { BasicPartnershipInquiry, CreatePartnershipInquiryRequest } from "./partnership-inquiry.dto";
import { prisma } from "../../infrastructure/database/prismaClient";
import { UserRole } from "../auth/auth.dto";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { PartnershipInquiryStatus } from "@prisma/client";
import { injectable } from "tsyringe";
import { PartnershipInquiryService } from "./partnership-inquiry.service";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";


@injectable()
@Route("api/v1/partnershipInquiries")
@Tags("Partnership Inquiry")
export class PartnershipInquiryController extends Controller {
  constructor(private readonly partnershipInquiryService: PartnershipInquiryService) {
    super();
  }

  @Post("")
  public async create(
    @Body() body: CreatePartnershipInquiryRequest,
  ): Promise<BasicPartnershipInquiry> {
    const partnershipInquiry = await prisma.partnershipInquiry.create({
      data: body,
    });

    await this.partnershipInquiryService.sendToAdminGroup(partnershipInquiry);
    return partnershipInquiry;
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
  ): Promise<PageResponse<BasicPartnershipInquiry>> {
    const where = {};

    const [partnershipInquiries, partnershipInquiriesCount] = await Promise.all([
      prisma.partnershipInquiry.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
      }),
      prisma.partnershipInquiry.count({ where }),
    ]);

    return new PageResponse(partnershipInquiries, page, size, partnershipInquiriesCount);
  }

  @Put("{id}/status")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "PartnershipInquiry not found"}>(404)
  public async putStatus(
    @Path() id: string,
    @Body() status: PartnershipInquiryStatus,
  ): Promise<BasicPartnershipInquiry> {
    const partnershipInquiry = await prisma.partnershipInquiry.findUnique({
      where: { id },
    });

    if (!partnershipInquiry) throw new HttpError(404, "PartnershipInquiry not found");

    return prisma.partnershipInquiry.update({
      where: { id },
      data: { status },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "PartnershipInquiry not found"}>(404)
  public async getById(
    @Path() id: string,
  ): Promise<BasicPartnershipInquiry> {
    const partnershipInquiry = await prisma.partnershipInquiry.findUnique({
      where: { id },
    });

    if(!partnershipInquiry) throw new HttpError(404, "PartnershipInquiry not found");

    return partnershipInquiry;
  }
}