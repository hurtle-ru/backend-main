import * as yup from "yup";


// You must exclude all requests type distinctive features in else you may get errors only by them
export function validateSyncByAtLeastOneSchema<T>(schemas: yup.Schema[], body: T): T {
  let firstError: any = null;

  for (const schema of schemas) {
    try {
      return schema.validateSync(body); 
    } catch (error) {
      firstError = firstError ?? error; console.log(error); 
    }
  }

  throw firstError;
}
