import { University } from "@prisma/client";
import * as yup from "yup";


export type BasicUniversity = Omit<
  University,
  | "id"
>;

export class GetAllUniversitiesRequest {
  static schema = yup.object({
    search: yup.string().trim().min(3),
  });
}
