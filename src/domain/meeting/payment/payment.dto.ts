import { MeetingPayment, MeetingType } from "@prisma/client";
import { BasicMeetingSlot } from "../slot/slot.dto"
import { tinkoff } from "../../../external/tinkoff/tinkoff.dto";
import StandardPaymentStatus = tinkoff.StandardPaymentStatus;
import { BasicManager } from "../../manager/manager.dto";
import {
  RequesterApplicant,
  RequesterEmployer,
  RequesterGuest,
} from "../../../infrastructure/controller/requester/requester.dto";

export type BasicMeetingPayment = Omit<
  MeetingPayment,
  | "slot"
  | "kassaPaymentId"
  | "successCode"
  | "failCode"
>;

export type CreateMeetingPaymentRequest = Pick<
  MeetingPayment,
  | "slotId"
  | "type"
>;

export type PutMeetingPaymentStatusRequest = { "status": "SUCCESS" | "FAIL", code: string };

export type GetMeetingPaymentResponse = BasicMeetingPayment & {
  slot?: BasicMeetingSlot | null;
};

export type MeetingPaymentTinkoffNotificationRequest = {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: tinkoff.NotificationPaymentStatus;
  PaymentId: number;
  ErrorCode: string;
  Amount: number;
  CardId: number;
  Pan: string;
  ExpDate: string;
  Token: string;
};

export const TinkoffPaymentStatusToMeetingPaymentStatus: {
  [key in StandardPaymentStatus]: "PENDING" | "FAIL" | "SUCCESS"
} = {
  NEW: "PENDING",
  FORM_SHOWED: "PENDING",
  FORMSHOWED: "PENDING",
  AUTHORIZING: "PENDING",
  CONFIRMING: "PENDING",
  PREAUTHORIZING: "PENDING",
  AUTHORIZED: "PENDING",
  CHECKED: "PENDING",
  CHECKING: "PENDING",
  PROCESSING: "PENDING",
  COMPLETED: "PENDING",
  COMPLETING: "PENDING",
  "3DS_CHECKED": "PENDING",
  "3DS_CHECKING": "PENDING",
  CANCELED: "FAIL",
  DEADLINE_EXPIRED: "FAIL",
  ATTEMPTS_EXPIRED: "FAIL",
  REJECTED: "FAIL",
  AUTH_FAIL: "FAIL",
  REVERSED: "FAIL",
  PARTIAL_REFUNDED: "FAIL",
  REFUNDED: "FAIL",
  UNKNOWN: "FAIL",
  REFUNDING: "FAIL",
  REVERSING: "FAIL",
  PARTIAL_REVERSED: "FAIL",
  CONFIRMED: "SUCCESS",
}