import * as yup from "yup";
import { yupInt32 } from "../../validation/requests/int32.yup";


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
  equals: yupInt32().optional(),
  in: yup.array().of(yupInt32()).optional(),
  notIn: yup.array().of(yupInt32()).optional(),
  lt: yupInt32().optional(),
  lte: yupInt32().optional(),
  gt: yupInt32().optional(),
  gte: yupInt32().optional(),
}).noUnknown(true);

export const parseIntFilterQueryParam = (param: string | undefined): any => {
  if (!param) return undefined;

  const parsedParam = JSON.parse(param);
  return intFilter.validateSync(parsedParam, { strict: true });
};
