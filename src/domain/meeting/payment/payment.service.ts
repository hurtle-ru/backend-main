import { injectable, singleton } from "tsyringe";
import { TinkoffPaymentService } from "../../../external/tinkoff/tinkoff.service";
import { MeetingType } from "@prisma/client";
import { meetingPriceByType, paymentConfig } from "./payment.config";
import { MeetingNameByType } from "../meeting.config";
import { MeetingPaymentTinkoffNotificationRequest } from "./payment.dto";
import otpGenerator from "otp-generator";


@injectable()
@singleton()
export class MeetingPaymentService {
  constructor(readonly tinkoffPaymentService: TinkoffPaymentService) {}

  async initPaymentSession(
    type: keyof typeof meetingPriceByType,
    meetingPaymentId: string,
    successCode: string,
    failCode: string,
    dueDate: string,
  ) {
    const description = `Хартл. ${MeetingNameByType[type]}`;

    const successUrl = new URL(paymentConfig.MEETING_PAYMENT_SUCCESS_URL_BASE);
    successUrl.searchParams.append("meetingPaymentId", meetingPaymentId);
    successUrl.searchParams.append("code", successCode);

    const failUrl = new URL(paymentConfig.MEETING_PAYMENT_FAIL_URL_BASE);
    failUrl.searchParams.append("meetingPaymentId", meetingPaymentId);
    failUrl.searchParams.append("code", failCode);

    const response = await this.tinkoffPaymentService.initPayment(
      meetingPaymentId,
      meetingPriceByType[type],
      description,
      successUrl.toString(),
      failUrl.toString(),
      paymentConfig.MEETING_PAYMENT_NOTIFICATION_URL,
      dueDate,
    );

    return {
      id: response.PaymentId,
      url: response.PaymentURL,
      amount: meetingPriceByType[type],
    };
  }

  doesMeetingTypeRequiresPayment(type: MeetingType): boolean {
    return meetingPriceByType.hasOwnProperty(type);
  }

  generateCode() {
    return otpGenerator.generate(16, { specialChars: false });
  }

  verifyToken(body: MeetingPaymentTinkoffNotificationRequest) {
    const { Token, ...bodyWithoutToken } = body;

    return Token != null && body.Token === this.tinkoffPaymentService.makeToken(bodyWithoutToken);
  }
}
