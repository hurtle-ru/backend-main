import * as yup from "yup";


const MAX_POSITIVE_POSTGRES_INTEGER = 2 ** 31 - 1
const MIN_NEGATIVE_POSTGRES_INTEGER = - (2 ** 31)


export function int32(number?: yup.NumberSchema): yup.NumberSchema {
    number = number ?? yup.number();
    return number.min(MIN_NEGATIVE_POSTGRES_INTEGER).max(MAX_POSITIVE_POSTGRES_INTEGER)
  }
