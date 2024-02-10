import axios from "axios";
import { singleton } from "tsyringe";
import crypto from "crypto"
import { tinkoffConfig } from "./tinkoff.config";
import { tinkoff } from "./tinkoff.dto"


function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest("hex");
}


@singleton()
export class TinkoffPaymentService {
  constructor() {
  }

  makeToken(amount: string, orderId: string, description: string, terminalPassword: string, terminalKey: string): string {
    return sha256(`${amount}${description}${orderId}${terminalPassword}${terminalKey}`)
  }

  async initPayment(customerId: string, orderId: string): Promise<tinkoff.InitTinkoffPaymentResponse> {
    const amount = tinkoffConfig.SLOT_PAYMENT_AMOUNT
    const description = tinkoffConfig.SLOT_PAYMENT_DESCRIPTION

    const token = this.makeToken(
      amount.toString(),
      orderId,
      description,
      tinkoffConfig.TERMINAL_PASSWORD,
      tinkoffConfig.TERMINAL_ID
    )

    const { data, status } = await axios.post<tinkoff.BaseInitTinkoffPaymentResponse>(
      'https://securepay.tinkoff.ru/v2/Init',
      {
        data: {
          Amount: amount,
          TerminalKey: tinkoffConfig.TERMINAL_ID,
          OrderId: orderId,
          Token: token,
          PayType: "O",
          Description: description,
          CustomerKey: customerId,
        }
      }
    );

    return {
      ...data,
      token,
    }
  }
  async getPaymentStatus(paymentId: string, token: string): Promise<tinkoff.GetPaymentStatusResponse> {
    const { data, status } = await axios.get<tinkoff.GetPaymentStatusResponse>(
      'https://securepay.tinkoff.ru/v2/GetState',
      {
        data: {
          TerminalKey: tinkoffConfig.TERMINAL_ID,
          PaymentId: paymentId,
          Token: token,
        }
      }
    );
    return data
  }
}
