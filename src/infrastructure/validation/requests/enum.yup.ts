import * as yup from "yup";


export function yupOneOfEnum<T extends string>(enumObject: { [s: string]: T } | ArrayLike<T>) {
  return yup.mixed<T>().oneOf(Object.values(enumObject));
}