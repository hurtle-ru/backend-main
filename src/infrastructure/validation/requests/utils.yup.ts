import * as yup from "yup";


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
