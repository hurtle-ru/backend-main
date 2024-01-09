import { MeetingScriptProtocol } from "@prisma/client";
import { BasicMeetingScriptAnswer } from "../answer/answer.dto";
import { BasicMeeting } from "../../meeting.dto";
import { BasicMeetingScriptTemplate } from "../template/template.dto";
import { BasicMeetingSlot } from "../../slot/slot.dto";

export type BasicMeetingScriptProtocol = Omit<
  MeetingScriptProtocol,
  | "answers"
  | "meeting"
  | "template"
>;

export type CreateMeetingScriptProtocolRequest = Pick<
  MeetingScriptProtocol,
  | "meetingId"
  | "templateId"
>;

export type GetMeetingScriptProtocolResponse = BasicMeetingScriptProtocol & {
  meeting?: BasicMeeting & { slot?: BasicMeetingSlot };
  template?: BasicMeetingScriptTemplate;
  answers?: BasicMeetingScriptAnswer[];
}