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
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { CreateMeetingPaymentRequest, CreateMeetingPaymentResponse } from "./payment.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { MeetingService } from "../meeting.service";
import { MeetingPaymentService } from "./payment.service";
import { meetingPriceByType } from "./payment.config";


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
  @Response<HttpErrorBody & { "error": "MeetingSlot not found" }>(404)
  @Response<HttpErrorBody & { "error": "MeetingSlot already booked" }>(409)
  @Response<HttpErrorBody & { "error": "Payment is not required to book meeting of this type" }>(409)
  @Response<HttpErrorBody & { "error": "User does not have access to this MeetingSlot type" }>(403)
  public async create(
    @Body() body: CreateMeetingPaymentRequest,
  ): Promise<CreateMeetingPaymentResponse> {
    const slot = await prisma.meetingSlot.findUnique({
      where: {
        id: body.slotId,
        dateTime: { gte: new Date() },
      },
      select: {
        meeting: true,
        types: true,
        dateTime: true,
      },
    });

    if(!slot) throw new HttpError(404, "MeetingSlot not found");
    if(slot.meeting) throw new HttpError(409, "MeetingSlot already booked");
    if(!this.paymentService.doesMeetingTypeRequiresPayment(body.type))
      throw new HttpError(409, "Payment is not required to book meeting of this type");
    if(!this.meetingService.doesUserHaveAccessToMeetingSlot("GUEST", slot.types))
      throw new HttpError(403, "User does not have access to this MeetingSlot type");

    const paymentData = await this.paymentService.initPaymentForMeeting(body.type as keyof typeof meetingPriceByType)

    await prisma.meetingPayment.create({
      data: {
        ...body,
        url: paymentData.url,
        token: paymentData.token
      }
    })

    return paymentData
  }
}
