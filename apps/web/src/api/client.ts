import { parseWithBigInt } from "@farm-clicker/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string;
}

/**
 * Parses via parseWithBigInt (not res.json()) since some responses encode currency
 * fields as BigInt-tagged strings that JSON.parse alone wouldn't decode.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? parseWithBigInt<T>(text) : (undefined as T);

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data;
}
