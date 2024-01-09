import { MeetingScriptTemplate } from "@prisma/client";
import { BasicMeetingScriptQuestion } from "../question/question.dto";
import { BasicMeetingScriptProtocol } from "../protocol/protocol.dto";

export type BasicMeetingScriptTemplate = Omit<
  MeetingScriptTemplate,
  | "protocols"
  | "questions"
>;

export type CreateMeetingScriptTemplateRequest = Pick<
  MeetingScriptTemplate,
  | "title"
  | "description"
>;

export type PutMeetingScriptTemplateRequest = CreateMeetingScriptTemplateRequest;

export type GetMeetingScriptTemplateResponse = BasicMeetingScriptTemplate & {
  protocols?: BasicMeetingScriptProtocol[];
  questions?: BasicMeetingScriptQuestion[];
}