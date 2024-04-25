import { EnvError, makeValidator } from "envalid";


export const int = makeValidator<number>((input: string) => {
  const coerced = parseInt(input, 10);
  if (Number.isNaN(coerced)) throw new EnvError(`Invalid integer input: "${input}"`);
  return coerced;
});