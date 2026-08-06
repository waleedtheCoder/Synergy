import { create } from "zustand";
import type { AuthUser } from "../types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  setSession: (session: { user: AuthUser; accessToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setHydrated: (isHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  setSession: ({ user, accessToken }) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ user: null, accessToken: null }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
