import type { AuthResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function register(email: string, username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { email, username, password },
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}
