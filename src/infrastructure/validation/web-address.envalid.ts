import { makeValidator } from "envalid";


export const webAddress = makeValidator<string>((input: string) => {
  const regex = /^(https?|ftp):\/\/([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})?(:\d+)?$/;
  if (!regex.test(input)) {
    throw new Error("Invalid URL format");
  }
  return input;
});