import { Manager } from "@prisma/client";
import { BasicMeetingSlot } from "../meeting/slot/slot.dto";


export type BasicManager = Omit<
  Manager,
  | "password"
  | "slots"
>;

export type GetManagerResponse = BasicManager & {
  slots?: BasicMeetingSlot[];
}

export type PutMeManagerRequest = Pick<
  BasicManager,
  | "name"
>;

export type PutByIdManagerRequest = Pick<
  BasicManager,
  | "name"
>;