import * as yup from "yup";


export function yupEnum(object: Object): yup.MixedSchema {
  return yup.mixed().oneOf(Object.values(object))
}
