/**
 * The date without time, ISO 8601 format
 * @isDate
 * @example "2024-01-20"
 */
export type DateWithoutTime = Date;

/**
 * @pattern ^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(20\d{2})$
 * @example "31/12/2023"
 */
export type UtcDate = string