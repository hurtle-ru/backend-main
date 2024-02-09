import { tinkoffConfig } from "./tinkoff.config";


/* eslint-disable @typescript-eslint/no-namespace */
export namespace tinkoff {

  // One or two steps
  export type PayType = "O" | "T";

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
    DATA: InitTinkoffPaymentRequestDATA
  }

  export interface CardData {
    pan: string,
    expiredDate: string,
    cardHolder?: string,
    cvv?: string,
  }

  export interface Check3DSVersionResponse {
    Version: string,
    TdsServerTransID: string,
    ThreeDSMethodURL: string,
    PaymentSystem: string,
    Success: boolean,
    ErrorCode: string,
    Message: string,
    Details: string,
  }

  export interface FinishAuthorizeResponse {
    Version: string,
    TdsServerTransID: string,
    ThreeDSMethodURL: string,
    PaymentSystem: string,
    Success: boolean,
    ErrorCode: string,
    Message: string,
    Details: string,
  }
}
