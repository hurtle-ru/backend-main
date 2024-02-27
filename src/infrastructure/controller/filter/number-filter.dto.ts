import * as yup from "yup";
import { yupPostgresNumber } from '../../validation/number.yup.postgres'


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
  equals: yupPostgresNumber().optional(),
  in: yup.array().of(yupPostgresNumber()).optional(),
  notIn: yup.array().of(yupPostgresNumber()).optional(),
  lt: yupPostgresNumber().optional(),
  lte: yupPostgresNumber().optional(),
  gt: yupPostgresNumber().optional(),
  gte: yupPostgresNumber().optional(),
}).noUnknown(true);

export const parseIntFilterQueryParam = (param: string | undefined): any => {
  if (!param) return undefined;

  const parsedParam = JSON.parse(param);
  return intFilter.validateSync(parsedParam, { strict: true });
};
