import * as yup from "yup";
import { int32 } from '../../validation/requests/int32.yup'
import { HttpError } from "../../error/http.error";


/**
* A JSON string representing the integer filter with the following structure:
* ```
* {
*   "equals?": number,
*   "in?": number[],
*   "notIn?": number[],
*   "lt?": number,
*   "lte?": number,
*   "gt?": number,
*   "gte?": number
* }
* ```
* Use encodeURIComponent(JSON.stringify(intFilterObject))
**/
export type IntFilterString = string;

const intFilter = yup.object({
  equals: int32().optional(),
  in: yup.array().of(int32()).optional(),
  notIn: yup.array().of(int32()).optional(),
  lt: int32().optional(),
  lte: int32().optional(),
  gt: int32().optional(),
  gte: int32().optional(),
}).noUnknown(true);

export const parseIntFilterQueryParam = (param: string | undefined): any => {
  if (!param) return undefined;

  const parsedParam = JSON.parse(param);
  return intFilter.validateSync(parsedParam, { strict: true });
};
