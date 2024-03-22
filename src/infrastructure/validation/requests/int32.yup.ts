import * as yup from "yup";


const MAX_POSITIVE_POSTGRES_INTEGER = 2 ** 31 - 1
const MIN_NEGATIVE_POSTGRES_INTEGER = - (2 ** 31)


export function int32(schema?: yup.NumberSchema): yup.NumberSchema {
  schema = schema ?? yup.number();
  return schema.min(MIN_NEGATIVE_POSTGRES_INTEGER).max(MAX_POSITIVE_POSTGRES_INTEGER)
}

export function uint32(schema?: yup.NumberSchema): yup.NumberSchema {
  schema = schema ?? yup.number();
  return schema.min(0).max(MAX_POSITIVE_POSTGRES_INTEGER)
}
