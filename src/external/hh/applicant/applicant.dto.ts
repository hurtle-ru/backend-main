import { hh, } from "../hh.dto";

export type BasicApplicant = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string | null;
  phone?: string | null;
  isApplicant: boolean;
}

export type ExtendedApplicant = BasicApplicant & {
  gender?: hh.Gender | null,
  birthDate?: Date   | null,
}