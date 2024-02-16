import * as yup from "yup";


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
  equals: yup.number().optional(),
  in: yup.array().of(yup.number()).optional(),
  notIn: yup.array().of(yup.number()).optional(),
  lt: yup.number().optional(),
  lte: yup.number().optional(),
  gt: yup.number().optional(),
  gte: yup.number().optional(),
}).noUnknown(true);

export const parseIntFilterQueryParam = (param: string | undefined): any => {
  if (!param) return undefined;

  const parsedParam = JSON.parse(param);
  return intFilter.validateSync(parsedParam, { strict: true });
};
