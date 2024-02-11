import { injectable, singleton } from "tsyringe";
import { TinkoffPaymentService } from "../../../external/payment/tinkoff/tinkoff.service";
import { v4 as uuidv4 } from "uuid";
import { MeetingType } from "@prisma/client";
import { meetingPriceByType, paymentConfig } from "./payment.config";
import { meetingNameByType } from "../meeting.config";


@injectable()
@singleton()
export class MeetingPaymentService {
  constructor(readonly tinkoffPaymentService: TinkoffPaymentService) {}

  async initPaymentForMeeting(type: keyof typeof meetingPriceByType) {
    const orderId = uuidv4();
    const description = `Хартл. ${meetingNameByType[type]}`;
    const successUrl = `${paymentConfig.MEETING_PAYMENT_SUCCESS_URL_BASE}`;
    const failUrl = `${paymentConfig.MEETING_PAYMENT_FAIL_URL_BASE}`;

    const response = await this.tinkoffPaymentService.initPayment(
      orderId,
      meetingPriceByType[type],
      description,
      successUrl,
      failUrl
    );

    return {
      id: response.PaymentId,
      url: response.PaymentURL,
    }
  }

  doesMeetingTypeRequiresPayment(type: MeetingType): boolean {
    return meetingPriceByType.hasOwnProperty(type);
  }
}
