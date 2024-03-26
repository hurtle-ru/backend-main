import * as yup from "yup";


export function makeSchemaWithAllOptionalFields<T extends yup.AnyObjectSchema>(schema: T): T {
  const schemaFields = schema.fields;
  const optionalFields: Record<string, yup.AnySchema> = {};

  for (const key in schemaFields) {
    const fieldSchema: any = schemaFields[key];
    optionalFields[key] = fieldSchema.optional();
  }

  return yup.object(optionalFields) as T;
}

export function validateSyncByAtLeastOneSchema(schemas: yup.AnyObjectSchema[], body: any): void {
  let firstError: any = null;

  schemas.forEach((schema) => {
    try {
      schema.validateSync(body);
      return;
    } catch (error) {
      if (firstError !== null) firstError = error;
    }
  });

  throw firstError;
}