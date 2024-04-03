import * as yup from "yup";


// You must exclude all requests type distinctive features in else you may get errors only by them
export function validateSyncByAtLeastOneSchema(schemas: yup.Schema[], body: any): void {
  let firstError: any = null;

  for (let schema of schemas) {
    try {
      schema.validateSync(body);
      return;
    } catch (error) { firstError = firstError ?? error; console.log(error) }
  };

  throw firstError;
}
