import { MeetingPayment, MeetingType } from "@prisma/client";
import { BasicMeetingSlot } from "../slot/slot.dto"

export type BasicMeetingPayment = Omit<
  MeetingPayment,
  | "slot"
>;

export type CreateMeetingPaymentRequest = Pick<
  MeetingPayment,
  | "slotId"
  | "guestEmail"
> & {
  type: MeetingType,
};

export type CreateMeetingPaymentResponse = Pick<
  MeetingPayment,
  | "id"
> & {
  "url": string,
}

export type GetMeetingPaymentResponse = BasicMeetingPayment & {
  slot?: BasicMeetingSlot | null;
};
