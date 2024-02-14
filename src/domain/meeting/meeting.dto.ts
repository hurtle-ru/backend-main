import { Meeting, MeetingType } from "@prisma/client";
import { UserRole } from "../auth/auth.dto";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicMeetingSlot } from "./slot/slot.dto";
import { BasicMeetingFeedback } from "./feedback/feedback.dto";
import { BasicMeetingScriptProtocol } from "./script/protocol/protocol.dto";


export type BasicRequestUser = {
  firstName: string;
  lastName: string;
  email: string;
}

export type BasicMeeting = Omit<
  Meeting,
  | "type"
  | "feedback"
  | "scripts"
  | "slot"
  | "applicant"
  | "employer"
>;

export type GetMeetingResponse = BasicMeeting & {
  feedback?: BasicMeetingFeedback[],
  scriptProtocols?: BasicMeetingScriptProtocol[],
  applicant?: BasicApplicant | null,
  employer?: BasicEmployer | null,
  slot?: BasicMeetingSlot,
};

export type CreateMeetingRequest = Pick<
  Meeting,
  | "name"
  | "description"
  | "slotId"
  | "type"
>;

export type PutMeetingRequestByApplicantOrEmployer = Pick<
  Meeting,
  | "name"
  | "description"
  | "slotId"
>;

export type PutMeetingRequestByManager = Pick<
  Meeting,
  | "status"
>;

export type ReschedulingRequest = Pick<
  Meeting,
  | "slotId"
>;

export const MeetingTypeByRole = {
  [UserRole.MANAGER]: [],
  [UserRole.EMPLOYER]: [MeetingType.CONSULTATION_B2B],
  [UserRole.APPLICANT]: [MeetingType.CONSULTATION_B2C, MeetingType.INTERVIEW],
}