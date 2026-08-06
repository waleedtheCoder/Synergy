import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "./types";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface SessionResponse {
  user: AuthUser;
  accessToken: string;
}

export async function registerRequest(input: RegisterInput) {
  const { data } = await apiClient.post<ApiEnvelope<SessionResponse>>(
    "/auth/register",
    input,
  );
  return data.data;
}

export async function loginRequest(input: LoginInput) {
  const { data } = await apiClient.post<ApiEnvelope<SessionResponse>>(
    "/auth/login",
    input,
  );
  return data.data;
}

export async function logoutRequest() {
  await apiClient.post<ApiEnvelope<null>>("/auth/logout");
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>("/auth/me");
  return data.data;
}

export async function verifyEmailRequest(token: string) {
  await apiClient.post<ApiEnvelope<null>>("/auth/verify-email", { token });
}

export async function forgotPasswordRequest(input: ForgotPasswordInput) {
  await apiClient.post<ApiEnvelope<null>>("/auth/forgot-password", input);
}

export async function resetPasswordRequest(input: ResetPasswordInput) {
  await apiClient.post<ApiEnvelope<null>>("/auth/reset-password", input);
}
