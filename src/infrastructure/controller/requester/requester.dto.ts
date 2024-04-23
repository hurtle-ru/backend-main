import * as yup from "yup";


export const APPLICANT = "APPLICANT";
export const EMPLOYER  = "EMPLOYER";
export const MANAGER   = "MANAGER";
export const GUEST     = "GUEST";

export type APPLICANT = "APPLICANT"
export type EMPLOYER  = "EMPLOYER"
export type MANAGER   = "MANAGER"
export type GUEST     = "GUEST"

export const APPLICANT_SCHEMA: yup.StringSchema<APPLICANT> = yup.string().defined().oneOf([APPLICANT,] as const,);
export const EMPLOYER_SCHEMA:  yup.StringSchema<EMPLOYER>  = yup.string().defined().oneOf([EMPLOYER,] as const,);
export const MANAGER_SCHEMA:   yup.StringSchema<MANAGER>   = yup.string().defined().oneOf([MANAGER,] as const,);
export const GUEST_SCHEMA:     yup.StringSchema<GUEST>     = yup.string().defined().oneOf([GUEST,] as const,);


export type RequesterApplicant = { "_requester": APPLICANT };
export type RequesterEmployer  = { "_requester": EMPLOYER };
export type RequesterManager   = { "_requester": MANAGER };
export type RequesterGuest     = { "_requester": GUEST };

export const RequesterApplicantSchema: yup.ObjectSchema<RequesterApplicant> = yup.object({
  _requester: APPLICANT_SCHEMA,
},);
export const RequesterEmployerSchema: yup.ObjectSchema<RequesterEmployer> = yup.object({
  _requester: EMPLOYER_SCHEMA,
},);
export const RequesterManagerSchema: yup.ObjectSchema<RequesterManager> = yup.object({
  _requester: MANAGER_SCHEMA,
},);
export const RequesterGuestSchema: yup.ObjectSchema<RequesterGuest> = yup.object({
  _requester: GUEST_SCHEMA,
},);
