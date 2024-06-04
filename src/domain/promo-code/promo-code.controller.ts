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
import { injectable } from "tsyringe";
import { GUEST_ROLE, JwtModel, PUBLIC_SCOPE, UserRole } from "../auth/auth.dto";
import {
  BasicPromoCode,
  CreatePromoCodeRequest,
  CreatePromoCodeRequestSchema, GetPromoCodeResponse,
  PatchByValuePromoCodeRequest, PatchByValuePromoCodeRequestSchema,
} from "./promo-code.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";


@injectable()
@Route("api/v1/promoCodes")
@Tags("PromoCode")
export class PromoCodeController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "PromoCode already exists"}>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreatePromoCodeRequest,
  ): Promise<BasicPromoCode> {
    CreatePromoCodeRequestSchema.validateSync(body);

    if (await prisma.promoCode.exists({ value: body.value })) {
      throw new HttpError(409, "PromoCode already exists");
    }

    return prisma.promoCode.create({
      data: {
        ...body,
        successfulUses: 0,
      },
    });
  }

  @Patch("{value}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "PromoCode does not exist"}>(404)
  public async patchByValue(
    @Request() req: JwtModel,
    @Path() value: string,
    @Body() body: PatchByValuePromoCodeRequest,
  ): Promise<BasicPromoCode> {
    PatchByValuePromoCodeRequestSchema.validateSync(body);

    if (!await prisma.promoCode.exists({ value })) {
      throw new HttpError(404, "PromoCode does not exist");
    }

    return prisma.promoCode.update({
      where: { value },
      data: body,
    });
  }

  @Get("{value}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT, GUEST_ROLE, PUBLIC_SCOPE])
  @Response<HttpErrorBody & {"error": "PromoCode does not exist"}>(404)
  public async getByValue(
    @Request() req: JwtModel | { user: undefined },
    @Path() value: string,
    @Query() include?: ("meetingPayments")[],
  ): Promise<GetPromoCodeResponse> {
    const promoCode = await prisma.promoCode.findUnique({
      where: { value },
      include: {
        meetingPayments: include?.includes("meetingPayments"),
      },
    });

    if (!promoCode) throw new HttpError(404, "PromoCode does not exist");
    if (req.user?.role === UserRole.MANAGER) return promoCode;

    if (!prisma.promoCode.isAvailable(promoCode)) throw new HttpError(404, "PromoCode does not exist");

    {
      const { value, discount, isActive } = promoCode;
      return { value, discount, isActive };
    }
  }

  @Delete("{value}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "PromoCode does not exist"}>(404)
  public async deleteByValue(
    @Request() req: JwtModel,
    @Path() value: string,
  ): Promise<BasicPromoCode> {
    if (!await prisma.promoCode.exists({ value })) {
      throw new HttpError(404, "PromoCode does not exist");
    }

    return prisma.promoCode.delete({ where: { value } });
  }
}