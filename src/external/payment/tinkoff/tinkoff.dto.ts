import { tinkoffConfig } from "./tinkoff.config";
import { OrderStatus } from "@prisma/client";


/* eslint-disable @typescript-eslint/no-namespace */
export namespace tinkoff {

  // One or two steps
  export type PayType = "O" | "T";

  export interface BaseInitTinkoffPaymentResponse {
    Success: boolean;
    ErrorCode: string;
    TerminalKey: string;
    Status: string;
    PaymentId: string;
    OrderId: string;
    Amount: number;
    PaymentURL: string;
  }

  export type InitTinkoffPaymentResponse = BaseInitTinkoffPaymentResponse & {
    token: string;
  }

  export interface InitTinkoffPaymentRequestDATA {
    OperationInitiatorType: number,
  }

  export interface InitTinkoffPaymentRequestBody {
    TerminalKey: string;
    Amount: number;
    OrderId: string;
    Token: string;
    Description: string;
    CustomerKey: string;
    PayType: PayType;
    DATA?: InitTinkoffPaymentRequestDATA;
  }

  export interface GetPaymentStatusResponse {
    Success: boolean,
    Status: OrderStatus,
    ErrorCode: string,
    Message: string,
    Details: string,
  }

  export interface CardData {
    pan: string,
    expiredDate: string,
    cardHolder?: string,
    cvv?: string,
  }
}
