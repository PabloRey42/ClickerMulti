/**
 * All currency/production values are plain BigInt (whole units). JSON has no BigInt
 * support, so the wire format encodes them as strings; these helpers convert an object
 * graph at the API boundary instead of relying on ad-hoc per-field casts.
 */

const BIGINT_SUFFIX = "n";

export function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? `${value.toString()}${BIGINT_SUFFIX}` : value;
}

export function bigIntReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }
  return value;
}

export function stringifyWithBigInt(value: unknown): string {
  return JSON.stringify(value, bigIntReplacer);
}

export function parseWithBigInt<T>(text: string): T {
  return JSON.parse(text, bigIntReviver) as T;
}
