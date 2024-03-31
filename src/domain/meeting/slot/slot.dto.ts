import { MeetingSlot, MeetingType } from "@prisma/client";
import { BasicMeeting } from "../meeting.dto";
import { BasicManager } from "../../manager/manager.dto";


export type BasicMeetingSlot = Omit<
  MeetingSlot,
  | "manager"
>;

export type CreateMeetingSlotRequest = Pick<
  MeetingSlot,
  | "dateTime"
  | "types"
>;

export type CreateMeetingSlotsWithinRangeRequest = Pick<
  MeetingSlot,
  | "types"
> & {
  /**
   * Интервал между слотами (в минутах)
   * @example 40
   */
  interval: number;
  startDate: Date;
  endDate: Date;
};

export type CreateMeetingSlotsWithinRangeResponse = {
  count: number,
}

export type PutMeetingSlotRequest = Pick<
  MeetingSlot,
  | "dateTime"
  | "types"
>;

export type GetMeetingSlotResponse = BasicMeetingSlot & {
  meeting?: BasicMeeting | null;
  manager?: BasicManager;
};