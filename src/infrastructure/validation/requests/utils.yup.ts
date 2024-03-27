import * as yup from "yup";


export function validateSyncByAtLeastOneSchema(schemas: yup.Schema[], body: any): void {
  let firstError: any = null;

  schemas.forEach((schema) => {
    try {
      schema.validateSync(body);
      return;
    } catch (error) { firstError = firstError ?? error }
  });

  throw firstError;
}
