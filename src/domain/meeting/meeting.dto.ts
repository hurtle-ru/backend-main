import { Meeting, MeetingType } from "@prisma/client";
import { UserRole } from "../auth/auth.dto";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicMeetingSlot } from "./slot/slot.dto";
import { BasicMeetingFeedback } from "./feedback/feedback.dto";
import { BasicMeetingScriptProtocol } from "./script/protocol/protocol.dto";
import {
  RequesterApplicant,
  RequesterEmployer,
  RequesterGuest,
} from "../../infrastructure/controller/requester/requester.dto";
import { CreateMeetingPaymentRequest } from "./payment/payment.dto";


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

export type CreateMeetingGuestRequest = CreateMeetingRequest & RequesterGuest & {
  "successCode": string
}

export type CreateMeetingApplicantOrEmployerRequest = CreateMeetingRequest & (RequesterApplicant | RequesterEmployer)


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