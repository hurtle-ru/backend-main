import { MeetingSlot, MeetingType } from "@prisma/client";
import { UserRole } from "../../auth/auth.dto";


export type BasicMeetingSlot = Omit<
  MeetingSlot,
  | "meeting"
  | "manager"
>;

export type CreateMeetingSlotRequest = Pick<
  MeetingSlot,
  | "dateTime"
  | "types"
>;

export type PutMeetingSlotRequest = Pick<
  MeetingSlot,
  | "dateTime"
  | "types"
>;


/**
 * @pattern ^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(20\d{2})$
 * @example "31/12/2023"
 */
export type UtcDate = string