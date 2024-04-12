import * as yup from 'yup'

import { MeetingPayment, MeetingPaymentStatus, MeetingType } from "@prisma/client";
import { BasicMeetingSlot } from "../slot/slot.dto"
import { tinkoff } from "../../../external/tinkoff/tinkoff.dto";
import StandardPaymentStatus = tinkoff.StandardPaymentStatus;
import { yupOneOfEnum } from '../../../infrastructure/validation/requests/enum.yup';
import { yupUint32 } from '../../../infrastructure/validation/requests/int32.yup';


export type BasicMeetingPayment = Omit<
  MeetingPayment,
  | "slot"
  | "kassaPaymentId"
  | "successCode"
  | "failCode"
>;

export const BasicMeetingPaymentSchema: yup.ObjectSchema<BasicMeetingPayment> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  status: yupOneOfEnum(MeetingPaymentStatus).defined(),
  guestEmail: yup.string().defined().email().max(512),
  url: yup.string().defined().trim().url().max(2048).nullable(),
  kassaPaymentId: yup.string().defined().min(1).max(512).nullable(),
  successCode: yup.string().defined().trim().min(1).max(512).nullable(),
  failCode: yup.string().defined().trim().min(1).max(512).nullable(),
  amount: yupUint32().defined().nullable(),
  dueDate: yup.date().defined(),
  slotId: yup.string().defined(),
  type: yupOneOfEnum(MeetingType).defined(),
})


export type CreateMeetingPaymentRequest = Pick<
  MeetingPayment,
  | "slotId"
  | "type"
>;
export const CreateMeetingPaymentRequestSchema: yup.ObjectSchema<CreateMeetingPaymentRequest> = BasicMeetingPaymentSchema.pick([
  "slotId",
  "type",
])

export type GetMeetingPaymentResponse = BasicMeetingPayment & {
  slot?: BasicMeetingSlot | null;
};

export type PatchMeetingPaymentRequest = Partial<Pick<MeetingPayment,
  | "status"
>> & {
  code: string;
};

export const PatchMeetingPaymentRequestSchema: yup.ObjectSchema<PatchMeetingPaymentRequest> = BasicMeetingPaymentSchema.pick([
  "status",
]).partial().shape({code: yup.string().trim().min(1).defined()})

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