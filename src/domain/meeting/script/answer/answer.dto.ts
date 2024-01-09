import { MeetingScriptAnswer } from "@prisma/client";
import { BasicMeetingScriptQuestion } from "../question/question.dto";
import { BasicMeetingScriptProtocol } from "../protocol/protocol.dto";

export type BasicMeetingScriptAnswer = Omit<
  MeetingScriptAnswer,
  | "protocol"
  | "question"
>;

export type CreateMeetingScriptAnswerRequest = Pick<
  MeetingScriptAnswer,
  | "text"
  | "protocolId"
  | "questionId"
>;

export type PutMeetingScriptAnswerRequest = CreateMeetingScriptAnswerRequest;

export type GetMeetingScriptAnswerResponse = BasicMeetingScriptAnswer & {
  protocol?: BasicMeetingScriptProtocol;
  question?: BasicMeetingScriptQuestion;
};