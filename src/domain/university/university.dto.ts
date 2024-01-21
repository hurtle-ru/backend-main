import { University } from "@prisma/client";
import yup from "../../infrastructure/validation/yup.provider";


export type BasicUniversity = Omit<
  University,
  | "id"
  | "name"
>;

export class GetAllUniversitiesRequest {
  static schema = yup.object({
    search: yup.string().trim().min(3),
  });
}
