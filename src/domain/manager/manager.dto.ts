import * as yup from "yup";

import { Manager, ManagerAccessScopes } from "@prisma/client";
import { BasicMeetingSlot } from "../meeting/slot/slot.dto";
import { yupManyOfEnum } from "../../infrastructure/validation/requests/enum.yup";


export type BasicManager = Omit<
  Manager,
  | "password"
  | "slots"
>;

export const BasicManagerSchema: yup.ObjectSchema<BasicManager> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  login: yup.string().defined().trim().min(3).max(255),
  name: yup.string().defined().trim().min(1).max(50),
  accessScopes: yupManyOfEnum(ManagerAccessScopes).defined(),
});


export type GetManagerResponse = BasicManager & {
  slots?: BasicMeetingSlot[];
}

export type PatchMeRequestByManager = Partial<Pick<
  BasicManager,
  | "name"
>>;

export const PatchMeRequestByManagerSchema: yup.ObjectSchema<PatchMeRequestByManager> = BasicManagerSchema.pick(["name"]).partial();

export type PatchByIdRequestByManager = Partial<Pick<
  BasicManager,
  | "name"
>>

export const PatchByIdRequestByManagerSchema: yup.ObjectSchema<PatchByIdRequestByManager> = BasicManagerSchema.pick(["name"]).partial();
