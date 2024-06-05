import { injectable, singleton } from "tsyringe";
import { TinkoffPaymentService } from "../../../external/tinkoff/tinkoff.service";
import { MeetingPayment, MeetingType } from "@prisma/client";
import { paymentConfig } from "./payment.config";
import { MeetingBusinessInfoByTypes, PaidMeetingBusinessInfo } from "../meeting.config";
import { MeetingPaymentTinkoffNotificationRequest } from "./payment.dto";
import otpGenerator from "otp-generator";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HttpError } from "../../../infrastructure/error/http.error";


@injectable()
@singleton()
export class MeetingPaymentService {
  constructor(readonly tinkoffPaymentService: TinkoffPaymentService) {}

  async initPaymentSession(
    meetingType: MeetingType,
    meetingPaymentId: string,
    successCode: string,
    failCode: string,
    dueDate: string,
    clientEmail: string,
    promoCode: { discount: number } | null,
  ) {
    const itemName = MeetingBusinessInfoByTypes[meetingType].name;
    const description = itemName;

    const successUrl = new URL(paymentConfig.MEETING_PAYMENT_SUCCESS_URL_BASE);
    successUrl.searchParams.append("meetingPaymentId", meetingPaymentId);
    successUrl.searchParams.append("code", successCode);

    const failUrl = new URL(paymentConfig.MEETING_PAYMENT_FAIL_URL_BASE);
    failUrl.searchParams.append("meetingPaymentId", meetingPaymentId);
    failUrl.searchParams.append("code", failCode);

    const priceInKopecks = (MeetingBusinessInfoByTypes[meetingType] as PaidMeetingBusinessInfo).priceInKopecks;
    let amount = promoCode ? Math.round(priceInKopecks * (1 - promoCode.discount / 100)) : priceInKopecks;
    if (amount < 100) amount = 100;

    const response = await this.tinkoffPaymentService.initPayment(
      meetingPaymentId,
      amount,
      description,
      successUrl.toString(),
      failUrl.toString(),
      paymentConfig.MEETING_PAYMENT_NOTIFICATION_URL,
      dueDate,
      clientEmail,
      itemName,
    );

    return {
      id: response.PaymentId,
      url: response.PaymentURL,
      amount,
    };
  }

  async checkPaymentExistsAndMatchesSpecifiedDataOrThrow(
    userId: string,
    slotPayments: Pick<MeetingPayment, "successCode" | "type" | "status" | "guestEmail">[],
    data: {type: MeetingType, successCode?: string}):
  Promise<never | void> {
    // TODO: Если платные встречи станут доступны для обычных пользователей и/или бесплатные станут доступны гостям, нужно будет пересмотреть логику этой валидации
    if (this.doesMeetingTypeRequiresPayment(data.type)) {
      const slotPaymentPaidByGuest = prisma.meetingPayment.getPaidByGuest(slotPayments, userId);

      if (!slotPaymentPaidByGuest)
        throw new HttpError(409, "Meeting requires MeetingPayment with SUCCESS status");

      if (slotPaymentPaidByGuest.successCode !== data.successCode)
        throw new HttpError(409, "Invalid MeetingPayment success code");

      if (slotPaymentPaidByGuest.type !== data.type)
        throw new HttpError(409, "Paid meeting type and passed type from request body don`t match");
    }
  }

  doesMeetingTypeRequiresPayment(type: MeetingType): boolean {
    return !MeetingBusinessInfoByTypes[type].isFree;
  }

  generateCode() {
    return otpGenerator.generate(16, { specialChars: false });
  }

  verifyToken(body: MeetingPaymentTinkoffNotificationRequest) {
    const { Token, ...bodyWithoutToken } = body;

    return Token != null && body.Token === this.tinkoffPaymentService.makeToken(bodyWithoutToken);
  }
}
