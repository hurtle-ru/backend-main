import { MeetingScriptQuestion } from "@prisma/client";
import { BasicMeetingScriptTemplate } from "../template/template.dto";
import { BasicMeetingScriptAnswer } from "../answer/answer.dto";

export type BasicMeetingScriptQuestion = Omit<
  MeetingScriptQuestion,
  | "answers"
  | "template"
>;

export type CreateMeetingScriptQuestionRequest = Pick<
  MeetingScriptQuestion,
  | "text"
  | "answerOptions"
>;

export type PutMeetingScriptQuestionRequest = CreateMeetingScriptQuestionRequest;

export type GetMeetingScriptQuestionResponse = BasicMeetingScriptQuestion & {
  answers?: BasicMeetingScriptAnswer[];
  template?: BasicMeetingScriptTemplate;
};