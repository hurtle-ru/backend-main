import * as yup from "yup";

import { Meeting, MeetingStatus, MeetingType } from "@prisma/client";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicMeetingSlot } from "./slot/slot.dto";
import { BasicMeetingFeedback } from "./feedback/feedback.dto";
import { BasicMeetingScriptProtocol } from "./script/protocol/protocol.dto";
import {
  APPLICANT_SCHEMA,
  EMPLOYER_SCHEMA,
  RequesterApplicant,
  RequesterApplicantSchema,
  RequesterEmployer,
  RequesterEmployerSchema,
  RequesterGuest,
  RequesterGuestSchema,
} from "../../infrastructure/controller/requester/requester.dto";
import { yupOneOfEnum } from "../../infrastructure/validation/requests/enum.yup";


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
});


export type UserMeetingCreator = { _type: "user", firstName: string, lastName: string, email: string }
export type GuestMeetingCreator = { _type: "guest"; email: string }

export type MeetingCreator = UserMeetingCreator | GuestMeetingCreator


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
  | "slotId"
  | "type"
>;


export const CreateMeetingRequestSchema: yup.ObjectSchema<CreateMeetingRequest> = BasicMeetingSchema.pick([
  "name",
  "description",
  "slotId",
  "type",
]);


export type CreateMeetingGuestRequest = CreateMeetingRequest & RequesterGuest & {
  "successCode": string
}

export const CreateMeetingGuestRequestSchema: yup.ObjectSchema<CreateMeetingGuestRequest> = CreateMeetingRequestSchema
  .concat(RequesterGuestSchema)
  .shape({ successCode: yup.string().trim().min(1).defined() });


export type CreateMeetingByApplicantOrEmployerRequest = CreateMeetingRequest & (RequesterApplicant | RequesterEmployer)

export const CreateMeetingByApplicantRequestSchema: yup.ObjectSchema<CreateMeetingRequest & RequesterApplicant> = CreateMeetingRequestSchema.concat(RequesterApplicantSchema);
export const CreateMeetingByEmployerRequestSchema: yup.ObjectSchema<CreateMeetingRequest & RequesterEmployer>  = CreateMeetingRequestSchema.concat(RequesterEmployerSchema);


export type PatchMeetingByManagerRequest = Partial<Pick<
  Meeting,
  | "name"
  | "description"
  | "status"
  | "transcript"
>>;

export const PatchMeetingByManagerRequestSchema: yup.ObjectSchema<PatchMeetingByManagerRequest> = BasicMeetingSchema.pick([
  "name",
  "description",
  "status",
  "transcript",
]).partial();


export type PatchMeetingByApplicantOrEmployerRequest = Partial<Pick<
  Meeting,
  | "slotId"
>>;

export const PatchMeetingByApplicantOrEmployerSchemaRequest: yup.ObjectSchema<PatchMeetingByApplicantOrEmployerRequest> = BasicMeetingSchema.pick([
  "slotId",
]).partial();


export type ExportAllRequest = {
  dateTime: Date,
  secret: string,
}

export type ExportAllResponse = {
  status: MeetingStatus,
  managerName: string
  roomUrl: string,
  applicantName?: string,
  employerName?: string,
  contact?: string
  email?: string,
}[];
