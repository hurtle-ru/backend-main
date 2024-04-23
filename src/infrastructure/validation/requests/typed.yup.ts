import * as yup from "yup";
import { ObjectSchema, } from "yup";


// Do not use this for now
export function yupTypedShape<T,>(obj: Record<keyof T, yup.AnySchema>, parentObject: ObjectSchema<any> = yup.object(),) {
  return parentObject.shape<typeof obj>(obj,);
}