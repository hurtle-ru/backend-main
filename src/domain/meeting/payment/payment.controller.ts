import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post, Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  BasicMeetingPayment,
  CreateMeetingPaymentRequest,
  MeetingPaymentTinkoffNotificationRequest,
  PutMeetingPaymentStatusRequest, TinkoffPaymentStatusToMeetingPaymentStatus,
} from "./payment.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { MeetingService } from "../meeting.service";
import { MeetingPaymentService } from "./payment.service";
import { meetingPriceByType, paymentConfig } from "./payment.config";
import moment from "moment";
import { tinkoffConfig } from "../../../external/tinkoff/tinkoff.config";
import { MeetingPayment } from "@prisma/client";
import { BasicMeetingSlot } from "../slot/slot.dto";
import { GuestRole, JwtModel } from "../../auth/auth.dto";


@injectable()
@Route("api/v1/meetingPayments")
@Tags("Meeting Payment")
export class MeetingPaymentController extends Controller {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly paymentService: MeetingPaymentService
  ) {
    super();
  }

  /**
   * Инициирует платежную сессию для оплаты встречи по слоту.
   */
  @Post("")
  @Security("jwt", [GuestRole])
  @Response<HttpErrorBody & { "error": "MeetingSlot not found" }>(404)
  @Response<HttpErrorBody & { "error": "User does not have access to this MeetingSlot type" }>(403)
  @Response<HttpErrorBody & { "error":
    | "MeetingSlot already booked"
    | "Payment is not required to book meeting of this type"
    | "Pending payment already exists on this slot"
  }>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingPaymentRequest,
  ): Promise<BasicMeetingPayment> {
    const slot = await prisma.meetingSlot.findUnique({
      where: {
        id: body.slotId,
        dateTime: { gte: new Date() },
      },
      select: {
        meeting: true,
        types: true,
        dateTime: true,
        payments: {
          select: {
            status: true,
            dueDate: true,
          },
        },
      },
    });

    if(!slot) throw new HttpError(404, "MeetingSlot not found");
    if(slot.meeting) throw new HttpError(409, "MeetingSlot already booked");
    
    if(prisma.meetingPayment.hasUnexpired(slot.payments))
      throw new HttpError(409, "Pending payment already exists on this slot");
    if(!this.paymentService.doesMeetingTypeRequiresPayment(body.type))
      throw new HttpError(409, "Payment is not required to book meeting of this type");
    if(!this.meetingService.doesUserHaveAccessToMeetingSlot("GUEST", slot.types))
      throw new HttpError(403, "User does not have access to this MeetingSlot type");

    const dueDate = moment()
      .add(paymentConfig.MEETING_PAYMENT_EXPIRATION_MINUTES, "minutes")
      .format("YYYY-MM-DDTHH:mm:ssZ");

    const successCode = this.paymentService.generateCode();
    const failCode = this.paymentService.generateCode();

    const meetingPayment = await prisma.meetingPayment.create({
      data: {
        slotId: body.slotId,
        guestEmail: req.user.id,
        dueDate,
        successCode,
        failCode,
      },
    });

    const paymentSession = await this.paymentService.initPaymentSession(
      body.type as keyof typeof meetingPriceByType,
      meetingPayment.id,
      successCode,
      failCode,
    );

    const updatedPayment = await prisma.meetingPayment.update({
      where: { id: meetingPayment.id },
      data: {
        amount: paymentSession.amount,
        url: paymentSession.url,
        kassaPaymentId: paymentSession.id,
      },
    });

    return {
      ...updatedPayment,
    }
  }

  @Post("tinkoffNotification")
  @Response<HttpErrorBody & { "error": "Invalid token" }>(401)
  public async processTinkoffNotification(
    @Body() body: MeetingPaymentTinkoffNotificationRequest
  ): Promise<"OK"> {
    if(!await this.paymentService.verifyToken(body)) throw new HttpError(401, "Invalid token");

    const mappedStatus = TinkoffPaymentStatusToMeetingPaymentStatus[body.Status];
    await prisma.meetingPayment.update({
      where: { id: body.OrderId },
      data: { status: mappedStatus },
    });

    return "OK";
  }
}
