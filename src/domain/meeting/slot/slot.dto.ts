import * as yup from "yup";

import { MeetingSlot, MeetingType, } from "@prisma/client";
import { BasicMeeting, } from "../meeting.dto";
import { BasicManager, } from "../../manager/manager.dto";
import { yupManyOfEnum, } from "../../../infrastructure/validation/requests/enum.yup";
import { yupUint32, } from "../../../infrastructure/validation/requests/int32.yup";


export type BasicMeetingSlot = Omit<
  MeetingSlot,
  | "manager"
>;

export const BasicMeetingSlotSchema = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  dateTime: yup.date().defined(
  ).min(
    new Date(new Date().getFullYear() - 1, 11,),
  ).max(
    new Date(new Date().getFullYear() + 1, 11,),
  ),
  types: yupManyOfEnum(MeetingType,).defined(),
  managerId: yup.string().defined().length(36,),
},);

export type CreateMeetingSlotRequest = Pick<
  MeetingSlot,
  | "dateTime"
  | "types"
>;

export const CreateMeetingSlotRequestSchema: yup.ObjectSchema<CreateMeetingSlotRequest> = BasicMeetingSlotSchema.pick([
  "dateTime",
  "types",
],);


export type CreateMeetingSlotsWithinRangeRequest = Pick<
  MeetingSlot,
  | "types"
> & {
  /**
   * Интервал между слотами (в минутах)
   * @example 40
   */
  interval: number;
  startDate: Date;
  endDate: Date;
};

export const CreateMeetingSlotsWithinRangeRequestSchema: yup.ObjectSchema<CreateMeetingSlotsWithinRangeRequest> = BasicMeetingSlotSchema.pick([
  "types",
],).shape({
  interval: yupUint32().defined(),
  startDate: yup.date().defined(
  ).min(
    new Date(new Date().getFullYear() - 1, 11,),
  ).max(
    new Date(new Date().getFullYear() + 1, 11,),
  ),
  endDate: yup.date().defined(
  ).min(
    new Date(new Date().getFullYear() - 1, 11,),
  ).max(
    new Date(new Date().getFullYear() + 1, 11,),
  ),
},);

export type CreateMeetingSlotsWithinRangeResponse = {
  count: number,
}

export type PatchMeetingSlotRequest = Partial<Pick<
  MeetingSlot,
  | "dateTime"
  | "types"
>>;

export const PatchMeetingSlotRequestSchema: yup.ObjectSchema<PatchMeetingSlotRequest> = BasicMeetingSlotSchema.pick([
  "dateTime",
  "types",
],).partial();

export type GetMeetingSlotResponse = BasicMeetingSlot & {
  meeting?: BasicMeeting | null;
  manager?: BasicManager;
};

/**
 * @isInt Should be integer
 * @minimum 1
 * @maximum 2000
 */
export type SlotPageSizeNumber = number;
