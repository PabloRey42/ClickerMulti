import { parseWithBigInt } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";

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

async function rawRequest<T>(path: string, options: RequestOptions): Promise<{ status: number; ok: boolean; data: T }> {
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
  return { status: res.status, ok: res.ok, data };
}

/** The access token (JWT_ACCESS_TTL, 15min by default) expires well before the
 * refresh token (REFRESH_TOKEN_TTL, 30d) — this used to surface as the player getting
 * logged out every ~15min. Single-flight so concurrent 401s only trigger one refresh call. */
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = rawRequest<{ accessToken: string }>("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    })
      .then((result) => (result.ok ? result.data.accessToken : null))
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * Parses via parseWithBigInt (not res.json()) since some responses encode currency
 * fields as BigInt-tagged strings that JSON.parse alone wouldn't decode.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const first = await rawRequest<T>(path, options);

  if (first.status === 401 && options.accessToken) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      useAuthStore.getState().setAccessToken(newAccessToken);
      const retry = await rawRequest<T>(path, { ...options, accessToken: newAccessToken });
      if (!retry.ok) {
        // Only a still-401 after a fresh token means the session itself is dead — any other
        // failure (500, 409, 400...) is unrelated to auth and must not force a logout.
        if (retry.status === 401) useAuthStore.getState().logout();
        throw new ApiError(retry.status, retry.data);
      }
      return retry.data;
    }
    useAuthStore.getState().logout();
    throw new ApiError(first.status, first.data);
  }

  if (!first.ok) {
    throw new ApiError(first.status, first.data);
  }

  return first.data;
}
