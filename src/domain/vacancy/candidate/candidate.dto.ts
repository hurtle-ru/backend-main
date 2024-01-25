import { Candidate } from "@prisma/client";
import { BasicApplicant } from "../../applicant/applicant.dto";
import { BasicVacancy } from "../vacancy.dto";
import { BasicManager } from "../../manager/manager.dto";


export type BasicCandidate = Omit<
  Candidate,
  | "applicant"
  | "vacancy"
  | "suggestedBy"
>;

export type CreateCandidateByManagerRequest = Pick<
  Candidate,
  | "status"
  | "applicantId"
>;

export type GetCandidateResponse = BasicCandidate & {
  applicant: BasicApplicant,
  vacancy: BasicVacancy,
  suggestedBy?: BasicManager | null,
};

export type PatchCandidateRequest = Partial<Pick<
  BasicCandidate,
  | "status"
>>
