import camelCase from "camelcase";

export function camelize(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(camelize);
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      acc[camelCase(key)] = camelize(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

export const ENGLISH_ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz";
export const RUSSIAN_ALPHABET_LOWER = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
export const DIGITS = "0123456789";