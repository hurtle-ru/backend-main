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