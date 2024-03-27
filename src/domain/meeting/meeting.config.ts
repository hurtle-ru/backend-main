import {AVAILABLE_IMAGE_FILE_MIME_TYPES} from "../../external/artifact/artifact.config";
import { MeetingType } from "@prisma/client";
import { GUEST_ROLE, UserRole } from "../auth/auth.dto";
import { bool, cleanEnv, port, str } from "envalid";


export const meetingConfig = cleanEnv(process.env, {
  MEETING_EXPORT_SECRET: str(),
});

export const AVAILABLE_PASSPORT_FILE_MIME_TYPES = [
  ...AVAILABLE_IMAGE_FILE_MIME_TYPES,
  "application/pdf",
]

export const MeetingTypeByRole = {
  [UserRole.MANAGER]: [],
  [UserRole.EMPLOYER]: [MeetingType.CONSULTATION_B2B],
  [UserRole.APPLICANT]: [MeetingType.CONSULTATION_B2C, MeetingType.INTERVIEW],
  [GUEST_ROLE]: [MeetingType.CONSULTATION_B2C_EXPERT],
}

export const MeetingNameByType = {
  [MeetingType.CONSULTATION_B2B]: "Консультация B2B",
  [MeetingType.CONSULTATION_B2C]: "Консультация B2C",
  [MeetingType.CONSULTATION_B2C_EXPERT]: "Консультация с экспертом",
  [MeetingType.INTERVIEW]: "Интервью",
}

export const ReminderMinutesBeforeMeeting = [
  60,
  24 * 60,
];