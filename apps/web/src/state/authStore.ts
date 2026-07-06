import { create } from "zustand";
import type { PublicUser } from "@farm-clicker/shared";

const STORAGE_KEY = "farm-clicker.auth";

interface StoredAuth {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: StoredAuth) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

function loadStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

const initial = loadStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial?.user ?? null,
  accessToken: initial?.accessToken ?? null,
  refreshToken: initial?.refreshToken ?? null,
  setSession: (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken });
  },
  setAccessToken: (accessToken) => {
    set((state) => {
      if (!state.user || !state.refreshToken) return state;
      const stored: StoredAuth = { user: state.user, accessToken, refreshToken: state.refreshToken };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      return { accessToken };
    });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
