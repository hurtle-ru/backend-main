import { MeetingSlot, MeetingType } from "@prisma/client";
import { BasicMeeting } from "../meeting.dto";
import { BasicManager } from "../../manager/manager.dto";


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

export type GetMeetingSlotResponse = BasicMeetingSlot & {
  meeting?: BasicMeeting | null;
  manager?: BasicManager;
};