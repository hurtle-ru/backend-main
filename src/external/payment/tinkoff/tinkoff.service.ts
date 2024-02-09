import axios from "axios";
import { singleton } from "tsyringe";
// import axios from "axios";
// import qs from "qs";
import crypto from "crypto"
import { tinkoffConfig } from "./tinkoff.config";
// import { HttpError } from "../../../infrastructure/error/http.error";
// // import { BasicHhToken } from "./tinkoff.dto";
// // import { Payment } from "@prisma/client";
// import { prisma } from "../../../infrastructure/database/prisma.provider";
import { tinkoff } from "./tinkoff.dto"


function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest("hex");
}

function getEncryptedCardData(cardData: object): string {
  const stringData = Object.entries(cardData).map(([key, value]) => `${key}=${value}`).join(';')
  const encryptedData = "???"

  return encryptedData
}


@singleton()
export class TinkoffPaymentService {
  constructor() {
  }

  makeToken(amount: string, orderId: string, description: string, terminalPassword: string, terminalKey: string): string {
    return sha256(`${amount}${description}${orderId}${description}${terminalPassword}${terminalKey}`)
  }

  makePaymentRequestBody(customerId: string, orderId: string): tinkoff.InitTinkoffPaymentRequestBody {
    const amount = tinkoffConfig.SLOT_PAYMENT_AMOUNT
    const description = tinkoffConfig.SLOT_PAYMENT_DESCRIPTION

    return {
      Amount: amount,
      TerminalKey: tinkoffConfig.TERMINAL_ID,
      OrderId: orderId,
      Token: this.makeToken(
        amount.toString(),
        orderId,
        description,
        tinkoffConfig.TERMINAL_PASSWORD,
        tinkoffConfig.TERMINAL_ID
      ),
      DATA: {
        OperationInitiatorType: tinkoffConfig.PAYMENT_INITIATOR_TYPE,
      },
      PayType: "O",
      Description: description,
      CustomerKey: customerId,
    }
  }


  async check3DsVersion(paymentId: string, cardData: tinkoff.CardData, token: string): Promise<tinkoff.Check3DSVersionResponse> {
    const response = await axios.get(`https://securepay.tinkoff.ru/v2/Check3dsVersion`, {
      data: {
        PaymentId: paymentId,
        CardData: this.getEncryptedCardData(cardData),
        Token: token,
        TerminalKey: tinkoffConfig.TERMINAL_ID,
      }
    });
    return response.data
  }

  async finishAuthorize(paymentId: string, cardData: tinkoff.CardData, token: string): Promise<tinkoff.FinishAuthorizeResponse> {
    const response = await axios.get(`https://securepay.tinkoff.ru/v2/FinishAuthorize`, {
      data: {
        PaymentId: paymentId,
        Token: token,
        TerminalKey: tinkoffConfig.TERMINAL_ID,
        SendEmail: true,
        Amount: tinkoffConfig.SLOT_PAYMENT_AMOUNT + "00",
        CardData: this.getEncryptedCardData(cardData),
      }
    });
    return response.data
  }

}