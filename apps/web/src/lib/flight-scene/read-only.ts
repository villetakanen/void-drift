/** A value no one may change, at every depth. */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value))
    return;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
}

/** A frozen deep copy: equal in value, never the same object as its input. */
export function readOnlyCopy<T>(value: T): DeepReadonly<T> {
  const copy = structuredClone(value);
  deepFreeze(copy);
  return copy as DeepReadonly<T>;
}
