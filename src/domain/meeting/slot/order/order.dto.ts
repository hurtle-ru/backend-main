import { Order } from "@prisma/client";
import { BasicMeetingSlot } from "../slot.dto"

export type BasicOrder = Omit<
  Order,
  | "slot"
>;

export type CreateOrderRequest = Pick<
  Order,
  "slotId"
>;

export type GetOrderResponse = BasicOrder & {
    slot?: BasicMeetingSlot | null;
};
