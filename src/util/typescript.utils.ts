export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type FullRequired<T extends object> = Required<{
  [K in keyof T]: Exclude<T[K], undefined>;
}>;