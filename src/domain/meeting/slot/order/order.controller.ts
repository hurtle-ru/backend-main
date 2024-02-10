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
import { JwtModel, UserRole } from "../../../auth/auth.dto";
import { prisma } from "../../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../../../infrastructure/error/http.error";
import { PageResponse } from "../../../../infrastructure/controller/pagination/page.response";
import { MeetingType } from "@prisma/client";
import { TinkoffPaymentService } from "../../../../external/payment/tinkoff/tinkoff.service";
import { PageNumber, PageSizeNumber } from "../../../../infrastructure/controller/pagination/page.dto";
import { tinkoff } from "../../../../external/payment/tinkoff/tinkoff.dto"
import { BasicOrder, GetOrderResponse, CreateOrderRequest } from "./order.dto"


@injectable()
@Route("api/v1/meetingSlots")
@Tags("Meeting Slot")
export class MeetingSlotController extends Controller {
  constructor(private readonly paymentService: TinkoffPaymentService) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateOrderRequest,
  ): Promise<BasicOrder> {
    // todo: firstly make uuid, init payment and then make order????
    const newOrder = await prisma.order.create({
      data: {...body, token: ""},
    });

    const initData = await this.paymentService.initPayment(req.user.id, newOrder.id)
    const token = initData.token
    const updatedOrder = await prisma.order.update({
        where: { id:newOrder.id },
        data: { token },
    });

    return updatedOrder
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Order not found"}>(404)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const order = await prisma.order.findUnique({ where: { id } });
    if(!order) throw new HttpError(404, "Order not found");

    await prisma.order.delete({ where: { id } });
  }

  @Get("{id}/paymentStatus")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Order not found"}>(404)
  public async getPaymentStatusById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<tinkoff.GetPaymentStatusResponse> {
    const order = await prisma.order.findUnique({where: { id }})

    if (!order) throw new HttpError(404, "Order not found")

    return this.paymentService.getPaymentStatus(order.id, order.token);
  }
  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Order not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<GetOrderResponse> {
    const order = await prisma.order.findUnique({where: { id }})

    if (!order) throw new HttpError(404, "Order not found")

    return order;
  }
}
