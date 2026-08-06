import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "./env";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { AuthUser } from "@/features/auth/types";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_ROUTES_WITHOUT_REFRESH = ["/auth/refresh", "/auth/login", "/auth/register"];

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<{ success: boolean; data: { user: AuthUser; accessToken: string } }>(
        "/auth/refresh",
      )
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.data);
        return data.data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      AUTH_ROUTES_WITHOUT_REFRESH.some((route) => requestUrl.includes(route))
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
    return apiClient(originalRequest);
  },
);
