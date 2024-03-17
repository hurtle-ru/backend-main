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
  RequesterGuest, RequesterManager,
} from "../../infrastructure/controller/requester/requester.dto";
import { CreateMeetingPaymentRequest } from "./payment/payment.dto";


export type BasicMeeting = Omit<
  Meeting,
  | "feedback"
  | "scriptProtocols"
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

export type CreateMeetingRequestByApplicantOrEmployer = CreateMeetingRequest & (RequesterApplicant | RequesterEmployer)


export type PutMeetingRequestByManager = Pick<
  Meeting,
  | "name"
  | "description"
  | "status"
  | "transcript"
>;

export type PutMeetingRequestByApplicantOrEmployer = Pick<
  Meeting,
  | "slotId"
>;

// export type PatchMeetingRequestByManager = Partial<PutMeetingRequestByManager> & RequesterManager;
// export type PatchMeetingRequestByApplicantOrEmployer = Partial<PutMeetingRequestByApplicantOrEmployer> & (RequesterApplicant | RequesterEmployer);