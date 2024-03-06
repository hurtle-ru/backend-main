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

export type PutMeRequestByManager = Pick<
  BasicManager,
  | "name"
>;

export type PutByIdRequestByManager = Pick<
  BasicManager,
  | "name"
>;