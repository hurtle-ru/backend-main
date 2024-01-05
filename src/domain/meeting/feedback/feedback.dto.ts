import { MeetingFeedback, MeetingSlot, MeetingType } from "@prisma/client";
import { BasicMeeting } from "../meeting.dto";


export type BasicMeetingFeedback = Omit<
  MeetingFeedback,
  | "meeting"
>;

export type CreateMeetingFeedbackRequest = Pick<
  MeetingFeedback,
  | "name"
  | "text"
  | "meetingId"
>;

export type PutMeetingFeedbackRequest = Pick<
  MeetingFeedback,
  | "name"
  | "text"
  | "meetingId"
>;

export type GetMeetingFeedbackResponse = BasicMeetingFeedback & {
  meeting: BasicMeeting,
};