import * as yup from 'yup'

import { MeetingFeedback, MeetingType } from "@prisma/client";
import { BasicMeeting } from "../meeting.dto";


export type BasicMeetingFeedback = Omit<
  MeetingFeedback,
  | "meeting"
>;

export const BasicMeetingFeedbackSchema: yup.ObjectSchema<BasicMeetingFeedback> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  name: yup.string().defined().min(1).max(100),
  text: yup.string().defined().min(1).max(1000),
  meetingId: yup.string().defined().length(36),
})

export type CreateMeetingFeedbackRequest = Pick<
  MeetingFeedback,
  | "name"
  | "text"
  | "meetingId"
>;
export const CreateMeetingFeedbackRequestSchema: yup.ObjectSchema<CreateMeetingFeedbackRequest> = BasicMeetingFeedbackSchema.pick([
  "name",
  "text",
  "meetingId",
])

export type PatchMeetingFeedbackRequest = Partial<Pick<
  MeetingFeedback,
  | "name"
  | "text"
  | "meetingId"
>>;
export const PatchMeetingFeedbackRequestSchema: yup.ObjectSchema<PatchMeetingFeedbackRequest> = BasicMeetingFeedbackSchema.pick([
  "name",
  "text",
  "meetingId",
]).partial()

export type GetMeetingFeedbackResponse = BasicMeetingFeedback & {
  meeting?: BasicMeeting,
};