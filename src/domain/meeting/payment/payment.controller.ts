import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Get, Hidden,
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
  CreateMeetingPaymentRequest,
  CreateMeetingPaymentRequestSchema,
  CreateMeetingPaymentResponse,
  GetMeetingPaymentResponse,
  MeetingPaymentTinkoffNotificationRequest,
  PatchMeetingPaymentRequest,
  PatchMeetingPaymentRequestSchema,
  TinkoffPaymentStatusToMeetingPaymentStatus,
} from "./payment.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { MeetingService } from "../meeting.service";
import { MeetingPaymentService } from "./payment.service";
import { paymentConfig } from "./payment.config";
import moment from "moment";
import { GUEST_ROLE, JwtModel } from "../../auth/auth.dto";

@injectable()
@Route("api/v1/meetingPayments")
@Tags("Meeting Payment")
export class MeetingPaymentController extends Controller {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly paymentService: MeetingPaymentService,
  ) {
    super();
  }

  /**
   * Инициирует платежную сессию для оплаты встречи по слоту.
   */
  @Post("")
  @Security("jwt", [GUEST_ROLE])
  @Response<HttpErrorBody & { "error": "MeetingSlot not found" }>(404)
  @Response<HttpErrorBody & { "error": "User does not have access to this MeetingSlot type" }>(403)
  @Response<HttpErrorBody & { "error":
      | "MeetingSlot already booked or paid"
      | "Payment is not required to book meeting of this type"
      | "Pending payment already exists on this slot"
      | "PromoCode not found or unavailable"
  }>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingPaymentRequest,
  ): Promise<CreateMeetingPaymentResponse> {
    body = CreateMeetingPaymentRequestSchema.validateSync(body);

    let promoCode = null;

    if (body.appliedPromoCodeValue) {
      const fetchedPromoCode = await prisma.promoCode.findUnique({
        where: { value: body.appliedPromoCodeValue },
      });

      if (!fetchedPromoCode || !prisma.promoCode.isAvailable(fetchedPromoCode)) {
        throw new HttpError(409, "PromoCode not found or unavailable");
      }

      promoCode = fetchedPromoCode;
    }

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
            guestEmail: true,
          },
        },
      },
    });

    if (!slot) throw new HttpError(404, "MeetingSlot not found");
    if (slot.meeting || prisma.meetingPayment.getPaidByGuest(slot.payments, req.user.id))
      throw new HttpError(409, "MeetingSlot already booked or paid");

    if (prisma.meetingPayment.hasPendingUnexpired(slot.payments))
      throw new HttpError(409, "Pending payment already exists on this slot");
    if (!this.paymentService.doesMeetingTypeRequiresPayment(body.type))
      throw new HttpError(409, "Payment is not required to book meeting of this type");
    if (!this.meetingService.doesUserHaveAccessToMeetingSlot("GUEST", slot.types))
      throw new HttpError(403, "User does not have access to this MeetingSlot type");

    const dueDate = moment()
      .add(paymentConfig.MEETING_PAYMENT_EXPIRATION_MINUTES, "minutes")
      .format("YYYY-MM-DDTHH:mm:ssZ");

    const guestEmail = req.user.id;
    const successCode = this.paymentService.generateCode();
    const failCode = this.paymentService.generateCode();

    const meetingPayment = await prisma.meetingPayment.create({
      data: {
        slotId: body.slotId,
        guestEmail,
        dueDate,
        successCode,
        failCode,
        type: body.type,
        appliedPromoCodeValue: body.appliedPromoCodeValue,
      },
    });

    const paymentSession = await this.paymentService.initPaymentSession(
      body.type,
      meetingPayment.id,
      successCode,
      failCode,
      dueDate,
      guestEmail,
      promoCode,
    );

    const updatedPayment = await prisma.meetingPayment.update({
      where: { id: meetingPayment.id },
      data: {
        amount: paymentSession.amount,
        url: paymentSession.url,
        kassaPaymentId: paymentSession.id,
      },
    });

    {
      const { kassaPaymentId, successCode, failCode, ...paymentResponse } = updatedPayment;
      return {
        ...paymentResponse,
        expirationMinutes: paymentConfig.MEETING_PAYMENT_EXPIRATION_MINUTES,
      };
    }
  }

  /**
   * Данный метод вызывается только внешним сервисом, Тинькофф Кассой
   */
  @Post("tinkoffNotification")
  @Response<HttpErrorBody & { "error": "Invalid token" }>(401)
  @Hidden()
  public async processTinkoffNotification(
    @Body() body: MeetingPaymentTinkoffNotificationRequest,
  ): Promise<"OK"> {
    if (!this.paymentService.verifyToken(body)) throw new HttpError(401, "Invalid token");

    const mappedStatus = TinkoffPaymentStatusToMeetingPaymentStatus[body.Status];
    await prisma.meetingPayment.update({
      where: { id: body.OrderId },
      data: { status: mappedStatus },
    });

    return "OK";
  }

  @Patch("{id}")
  @Security("jwt", [GUEST_ROLE])
  @Response<HttpErrorBody & { "error": "Payment not found" }>(404)
  @Response<HttpErrorBody & { "error": "Invalid code" }>(401)
  @Response<HttpErrorBody & { "error": "Payment expired" }>(409)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchMeetingPaymentRequest,
  ): Promise<GetMeetingPaymentResponse> {
    body = PatchMeetingPaymentRequestSchema.validateSync(body);

    const where = { id, guestEmail: req.user.id };
    const payment = await prisma.meetingPayment.findUnique({ where });

    if (!payment) throw new HttpError(404, "Payment not found");
    if (payment.dueDate < new Date()) throw new HttpError(409, "Payment expired");
    if ((body.status === "SUCCESS" && payment.successCode === body.code)
      || (body.status === "FAIL" && payment.failCode === body.code)) {

      const updatedPayment = await prisma.meetingPayment.update({
        where,
        data: { status: body.status },
      });

      const { kassaPaymentId, successCode, failCode, ...paymentResponse } = updatedPayment;
      return {
        ...paymentResponse,
        expirationMinutes: paymentConfig.MEETING_PAYMENT_EXPIRATION_MINUTES,
      };
    } else throw new HttpError(401, "Invalid code");
  }

  @Get("{id}")
  @Security("jwt", [GUEST_ROLE])
  @Response<HttpErrorBody & { "error": "Payment not found" }>(404)
  @Response<HttpErrorBody & { "error": "Code is invalid" }>(403)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() successOrFailCode: string,
    @Query() include?: ("slot")[],
  ): Promise<GetMeetingPaymentResponse> {
    const payment = await prisma.meetingPayment.findUnique({
      where: { id, guestEmail: req.user.id },
      include: {
        slot: include?.includes("slot"),
      },
    });

    if (!payment) throw new HttpError(404, "Payment not found");
    if (payment.successCode !== successOrFailCode && payment.failCode !== successOrFailCode)
      throw new HttpError(403, "Code is invalid");

    return {
      ...payment,
      expirationMinutes: paymentConfig.MEETING_PAYMENT_EXPIRATION_MINUTES,
    };
  }
}
