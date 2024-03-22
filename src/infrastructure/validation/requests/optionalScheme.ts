import * as yup from 'yup'


export function makeSchemeWithAllOptionalFields<T extends yup.AnyObjectSchema>(schema: T): T {
  const schemaFields = schema.fields;
  const optionalFields: Record<string, yup.AnySchema> = {};

  for (let key in schemaFields) {
    const fieldSchema: any = schemaFields[key];
    optionalFields[key] = fieldSchema.optional();
  }

  return yup.object(optionalFields) as T;
}
