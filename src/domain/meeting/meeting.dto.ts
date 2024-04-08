import * as yup from 'yup'

import { Meeting, MeetingStatus, MeetingType } from "@prisma/client";
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
import { yupOneOfEnum } from '../../infrastructure/validation/requests/enum.yup';


export type BasicMeeting = Omit<
  Meeting,
  | "feedback"
  | "scriptProtocols"
  | "slot"
  | "applicant"
  | "employer"
>;

export const BasicMeetingSchema: yup.ObjectSchema<BasicMeeting> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  name: yup.string().defined().trim().min(2).max(100),
  description: yup.string().defined().trim().max(1000),
  roomUrl: yup.string().defined().min(3).max(255),
  type: yupOneOfEnum(MeetingType).defined(),
  status: yupOneOfEnum(MeetingStatus).defined(),
  transcript: yup.string().defined().min(3).max(65535).nullable(),
  slotId: yup.string().defined().length(36),
  guestEmail: yup.string().defined().min(3).max(255).nullable(),
  applicantId: yup.string().defined().length(36).nullable(),
  employerId: yup.string().defined().length(36).nullable(),
})

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

export type ExportAllRequest = {
  dateTime: Date,
  secret: string,
}

// Данные для экспорта: {Имя, Способ связи, Рекрутер}
export type ExportAllResponse = {
  status: MeetingStatus,
  managerName: string
  roomUrl: string,
  applicantName?: string,
  employerName?: string,
  contact?: string
  email?: string,
}[];
