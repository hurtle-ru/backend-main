
export type APPLICANT = "APPLICANT"
export type EMPLOYER = "EMPLOYER"
export type MANAGER = "MANAGER"
export type GUEST = "GUEST"

export type RequesterApplicant = { "_requester": "APPLICANT" };
export type RequesterEmployer = { "_requester": "EMPLOYER" };
export type RequesterManager = { "_requester": "MANAGER" };
export type RequesterGuest = { "_requester": "GUEST" };
