import { University } from "@prisma/client";
import * as yup from "yup";


export type BasicResume = Omit<
  University,
  | "id"
  | "shortName"
  | "fullName"
>;

export class GetUniversitiesRequest {
  static schema = yup.object({
    search: yup.string().email().min(2),
  });
}
