import { tinkoffConfig, } from "./tinkoff.config";


/* eslint-disable @typescript-eslint/no-namespace */
export namespace tinkoff {

  // One or two steps
  export type PayType = "O" | "T";

  export interface InitTinkoffPaymentResponse {
    Success: boolean;
    ErrorCode: string;
    TerminalKey: string;
    Status: string;
    PaymentId: string;
    OrderId: string;
    Amount: number;
    PaymentURL: string;
  }

  // Standard Payment - стандартный одностадийный платеж без PCI DSS
  export interface GetStandardPaymentStateResponse {
    TerminalKey: string;
    Amount: number;
    OrderId: string;
    Success: string;
    Status: StandardPaymentStatus;
    PaymentId: string;
    ErrorCode: string | "0";
    Message?: string;
    Details?: string;
  }

  /*
  * CANCELED - корректное написание по документации Тинкофф
  * FORM_SHOWED и FORMSHOWED присутствуют оба в документации Тинькофф
  **/
  export enum StandardPaymentStatus {
    NEW = "NEW",
    FORM_SHOWED = "FORM_SHOWED",
    FORMSHOWED = "FORMSHOWED",
    AUTHORIZING = "AUTHORIZING",
    AUTHORIZED = "AUTHORIZED",
    CONFIRMING = "CONFIRMING",
    CONFIRMED = "CONFIRMED",
    REVERSING = "REVERSING",
    PARTIAL_REVERSED = "PARTIAL_REVERSED",
    REVERSED = "REVERSED",
    REFUNDING = "REFUNDING",
    PARTIAL_REFUNDED = "PARTIAL_REFUNDED",
    REFUNDED = "REFUNDED",
    CANCELED = "CANCELED",
    DEADLINE_EXPIRED = "DEADLINE_EXPIRED",
    ATTEMPTS_EXPIRED = "ATTEMPTS_EXPIRED",
    REJECTED = "REJECTED",
    AUTH_FAIL = "AUTH_FAIL",
    CHECKING = "CHECKING",
    CHECKED = "CHECKED",
    COMPLETING = "COMPLETING",
    COMPLETED = "COMPLETED",
    PROCESSING = "PROCESSING",
    "3DS_CHECKING" = "3DS_CHECKING",
    "3DS_CHECKED" = "3DS_CHECKED",
    PREAUTHORIZING = "PREAUTHORIZING",
    UNKNOWN = "UNKNOWN",
  }

  export enum NotificationPaymentStatus {
    AUTHORIZED = "AUTHORIZED",
    CONFIRMED = "CONFIRMED",
    PARTIAL_REVERSED = "PARTIAL_REVERSED",
    REVERSED = "REVERSED",
    PARTIAL_REFUNDED = "PARTIAL_REFUNDED",
    REFUNDED = "REFUNDED",
    REJECTED = "REJECTED",
    "3DS_CHECKING" = "3DS_CHECKING"
  }
}
