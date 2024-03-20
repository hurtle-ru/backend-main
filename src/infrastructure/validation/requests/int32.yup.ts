import * as yup from "yup";


const MAX_POSITIVE_POSTGRES_INTEGER = 2 ** 31 - 1
const MIN_NEGATIVE_POSTGRES_INTEGER = - (2 ** 31)


export function int32(schema?: yup.NumberSchema): yup.NumberSchema {
  schema = schema ?? yup.number();
  return schema.min(MIN_NEGATIVE_POSTGRES_INTEGER).max(MAX_POSITIVE_POSTGRES_INTEGER)
}

export function uint32(schema?: yup.NumberSchema, min: number = 0): yup.NumberSchema {
  if (min < 0) throw new Error("Min value must be not negative number")
  if (min >= MAX_POSITIVE_POSTGRES_INTEGER) throw new Error("Min value must be less then postgres max value")

  schema = schema ?? yup.number();
  return schema.min(min).max(MAX_POSITIVE_POSTGRES_INTEGER)
}
