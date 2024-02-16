import axios from "axios";
import { singleton } from "tsyringe";
import { tinkoffConfig } from "./tinkoff.config";
import { tinkoff } from "./tinkoff.dto";
import crypto from "crypto";


@singleton()
export class TinkoffPaymentService {
  constructor() {}

  /**
   * Инициирует платежную сессию
   * @param {string} orderId Уникальный идентификатор заказа, для которого проводится платёж
   * @param {number} amount Целое число, выражающее сумму в **копейках**. Например, сумма 3руб. 12коп. - это число 312
   * @param {string} description Описание заказа
   * @param {string} successUrl URL, куда будет переведен клиент в случае успешной оплаты
   * @param {string} failUrl URL, куда будет переведен клиент в случае неуспешной оплаты
   * @param {string} notificationUrl URL (вебхук), куда Тинькофф Касса отправит запрос по завершении оплаты
   */
  async initPayment(
    orderId: string,
    amount: number,
    description: string,
    successUrl: string,
    failUrl: string,
    notificationUrl: string
  ): Promise<tinkoff.InitTinkoffPaymentResponse> {
    const requestBody = {
      TerminalKey: tinkoffConfig.TINKOFF_TERMINAL_ID,
      Amount: amount,
      OrderId: orderId,
      Description: description,
      SuccessURL: successUrl,
      FailURL: failUrl,
      NotificationUrl: notificationUrl,
    };

    const response = await axios.post<tinkoff.InitTinkoffPaymentResponse>(
      "https://securepay.tinkoff.ru/v2/Init",
      { ...requestBody, Token: this.makeToken(requestBody) }
    );

    return response.data;
  }

  async getPaymentState(paymentId: string): Promise<tinkoff.GetStandardPaymentStateResponse> {
    const requestBody = {
      TerminalKey: tinkoffConfig.TINKOFF_TERMINAL_ID,
      PaymentId: paymentId,
    };

    const response = await axios.post<tinkoff.GetStandardPaymentStateResponse>(
      "https://securepay.tinkoff.ru/v2/GetState",
      { ...requestBody, Token: this.makeToken(requestBody) }
    );

    return response.data;
  }

  makeToken(requestData: Record<string, any | number | undefined>): string {
    const dataWithCredentials: Record<string, any | number> = {
      ...Object.fromEntries(Object.entries(requestData).filter(([_, value]) => value !== undefined)),
      Password: tinkoffConfig.TINKOFF_TERMINAL_PASSWORD,
    };

    const sortedKeys = Object.keys(dataWithCredentials).sort();
    const concatenatedValues = sortedKeys.map(key => String(dataWithCredentials[key])).join('');

    return this.sha256(concatenatedValues).toString();
  }

  sha256(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex");
  }
}