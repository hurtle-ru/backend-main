import * as yup from "yup";

import { University } from "@prisma/client";


export type BasicUniversity = Omit<
  University,
  | "id"
>;

export const BasicUniversitySchema: yup.ObjectSchema<BasicUniversity> = yup.object({
  name: yup.string().defined().min(1).max(300),
  shortName: yup.string().defined().min(1).max(100).nullable(),
  logoUrl: yup.string().defined().min(1).max(255).nullable(),
});

export const GetAllUniversitiesRequestSearchSchema = yup.string().min(3).max(300).defined();
