import axios from "axios";
import { singleton } from "tsyringe";
import { tinkoffConfig } from "./tinkoff.config";
import { tinkoff } from "./tinkoff.dto";
import crypto from "crypto";
import { logger } from "../../infrastructure/logger/logger";


/* Проверка подписей на стороне Тинькофф работает крайне нестабильно и некорректно.
*  Некоторые поля (даже скалярные) Тинькофф без всякого упоминания в документации будет игнорировать при сверке подписей.
*/
@singleton()
export class TinkoffPaymentService {
  constructor() {}

  /**
   * Инициирует платежную сессию. На данный момент метод поддерживает только платежи с продажей 1-й услуги за платеж.
   * @param {string} orderId Уникальный идентификатор заказа, для которого проводится платёж
   * @param {number} amount Целое число, выражающее сумму в **копейках**. Например, сумма 3руб. 12коп. - это число 312
   * @param {string} description Описание заказа
   * @param {string} successUrl URL, куда будет переведен клиент в случае успешной оплаты
   * @param {string} failUrl URL, куда будет переведен клиент в случае неуспешной оплаты
   * @param {string} notificationUrl URL (вебхук), куда Тинькофф Касса отправит запрос по завершении оплаты
   * @param {string} dueDate Срок жизни платежа, после которого оплата будет невозможна
   * @param {string} clientEmail Email клиента
   * @param {string} itemName Наименование товара. Максимальное количество символов - 128
   */
  async initPayment(
    orderId: string,
    amount: number,
    description: string,
    successUrl: string,
    failUrl: string,
    notificationUrl: string,
    dueDate: string,
    clientEmail: string,
    itemName: string,

  ): Promise<tinkoff.InitTinkoffPaymentResponse> {
    const requestBody = {
      TerminalKey: tinkoffConfig.TINKOFF_TERMINAL_ID,
      Amount: amount,
      OrderId: orderId,
      Description: description,
      SuccessURL: successUrl,
      FailURL: failUrl,
      NotificationUrl: notificationUrl,
      RedirectDueDate: dueDate,
      Receipt: {
        FfdVersion: "1.2",
        Taxation: "usn_income",
        Email: clientEmail,
        Items: [
          {
            Name: itemName,
            Price: amount,
            Quantity: 1,
            Amount: amount, // Quantity * Amount
            Tax: "none",
            PaymentMethod: "full_payment",
            PaymentObject: "service",
            MeasurementUnit: "шт",
          },
        ],
      },
    };

    const response = await axios.post<tinkoff.InitTinkoffPaymentResponse>(
      "https://securepay.tinkoff.ru/v2/Init",
      { ...requestBody, Token: this.makeToken(requestBody) },
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
      { ...requestBody, Token: this.makeToken(requestBody) },
    );

    return response.data;
  }

  makeToken(requestData: Record<string, any | number | undefined>): string {
    const ignoreKeys = ["NotificationUrl"];

    const dataWithCredentials: Record<string, any | number> = {
      ...Object.fromEntries(Object.entries(requestData).filter(([key, value]) =>
        value !== undefined
        && value !== null
        && typeof value !== "object"
        && !ignoreKeys.includes(key),
      )),
      Password: tinkoffConfig.TINKOFF_TERMINAL_PASSWORD,
    };

    // Сортируем ключи по алфавиту
    const sortedKeys = Object.keys(dataWithCredentials).sort();

    // Конкатенируем значения в одну строку
    const concatenatedValues = sortedKeys.map(key => String(dataWithCredentials[key])).join("");

    // Возвращаем хеш строку
    return this.sha256(concatenatedValues).toLowerCase();
  }

  sha256(input: string): string {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
  }
}