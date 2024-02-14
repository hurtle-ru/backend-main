import { injectable, singleton } from "tsyringe";
import { TinkoffPaymentService } from "../../../external/tinkoff/tinkoff.service";
import { v4 as uuidv4 } from "uuid";
import { MeetingPayment, MeetingPaymentStatus, MeetingType } from "@prisma/client";
import { meetingPriceByType, paymentConfig } from "./payment.config";
import { meetingNameByType } from "../meeting.config";
import { TinkoffPaymentStatusToMeetingPaymentStatus } from "./payment.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import otpGenerator from "otp-generator";
import { success } from "concurrently/dist/src/defaults";


@injectable()
@singleton()
export class MeetingPaymentService {
  constructor(readonly tinkoffPaymentService: TinkoffPaymentService) {}

  async initPaymentSession(type: keyof typeof meetingPriceByType, meetingPaymentId: string, successCode: string, failCode: string) {
    const description = `Хартл. ${meetingNameByType[type]}`;

    const successUrl = new URL(paymentConfig.MEETING_PAYMENT_SUCCESS_URL_BASE);
    successUrl.searchParams.append("orderId", meetingPaymentId);
    successUrl.searchParams.append("code", successCode);

    const failUrl = new URL(paymentConfig.MEETING_PAYMENT_FAIL_URL_BASE);
    failUrl.searchParams.append("meetingPaymentId", meetingPaymentId);
    failUrl.searchParams.append("code", successCode);

    const response = await this.tinkoffPaymentService.initPayment(
      meetingPaymentId,
      meetingPriceByType[type],
      description,
      successUrl.toString(),
      failUrl.toString(),
    );

    return {
      id: response.PaymentId,
      url: response.PaymentURL,
      amount: meetingPriceByType[type],
    };
  }

  async updatePaymentStatusIfNeed(payment: MeetingPayment): Promise<MeetingPaymentStatus> {
    if (["SUCCESS", "FAIL"].includes(payment.status)) return payment.status;

    const currentTimeBeforeRequest = new Date();

    const tinkoffPaymentState = await this.tinkoffPaymentService.getPaymentState(payment.kassaPaymentId);
    let mappedStatus = TinkoffPaymentStatusToMeetingPaymentStatus[tinkoffPaymentState.Status];

    if(mappedStatus === "PENDING" && currentTimeBeforeRequest > payment.dueDate) mappedStatus = "DEADLINE_EXPIRED"

    if(payment.status !== mappedStatus) {
      await prisma.meetingPayment.update({
        where: { id: payment.id },
        data: { status: mappedStatus },
      });
    }

    return mappedStatus;
  }

  doesMeetingTypeRequiresPayment(type: MeetingType): boolean {
    return meetingPriceByType.hasOwnProperty(type);
  }

  generateCode() {
    return otpGenerator.generate(16, { specialChars: false });
  }
}
