import { Manager } from "@prisma/client";
import { BasicMeetingSlot } from "../meeting/slot/slot.dto";


export type BasicManager = Omit<
  Manager,
  | "password"
  | "passwordId"
  | "slots"
>;

export type ManagerGetResponse = BasicManager & {
  slots?: BasicMeetingSlot[];
}

export type ManagerPutMeRequest = Pick<
  BasicManager,
  | "name"
>;

export type ManagerPutByIdRequest = Pick<
  BasicManager,
  | "name"
>;