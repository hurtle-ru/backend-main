import { hh, } from "../hh.dto";

export type GetMineResumeResponse = {
  id: string;
  title?: string | null;
  gender?: hh.Gender | null;
  birthDate?: Date | null;
  createdAt: Date;
}