import * as yup from "yup";

import { MeetingScriptProtocol, } from "@prisma/client";
import { BasicMeetingScriptAnswer, } from "../answer/answer.dto";
import { BasicMeeting, } from "../../meeting.dto";
import { BasicMeetingScriptTemplate, } from "../template/template.dto";
import { BasicMeetingSlot, } from "../../slot/slot.dto";


export type BasicMeetingScriptProtocol = Omit<
  MeetingScriptProtocol,
  | "answers"
  | "meeting"
  | "template"
>;

export const BasicMeetingScriptProtocolSchema: yup.ObjectSchema<BasicMeetingScriptProtocol> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  dateTime: yup.date().defined(),
  meetingId: yup.string().defined().length(36,),
  templateId: yup.string().defined().length(36,),
},);


export type CreateMeetingScriptProtocolRequest = Pick<
  MeetingScriptProtocol,
  | "meetingId"
  | "templateId"
>;

export const CreateMeetingScriptProtocolRequestSchema: yup.ObjectSchema<CreateMeetingScriptProtocolRequest> = BasicMeetingScriptProtocolSchema.pick([
  "meetingId",
  "templateId",
],);

export type GetMeetingScriptProtocolResponse = BasicMeetingScriptProtocol & {
  meeting?: BasicMeeting & { slot?: BasicMeetingSlot };
  template?: BasicMeetingScriptTemplate;
  answers?: BasicMeetingScriptAnswer[];
}