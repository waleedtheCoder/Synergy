import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "./store/auth-store";
import {
  fetchCurrentUser,
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resetPasswordRequest,
  verifyEmailRequest,
} from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useCurrentUser() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const user = await fetchCurrentUser();
        setSession({ user, accessToken: accessToken ?? "" });
        return user;
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        setHydrated(true);
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (session) => {
      setSession(session);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not create your account"));
    },
  });
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      setSession(session);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Invalid email or password"));
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: verifyEmailRequest,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPasswordRequest,
    onError: (error) => {
      toast.error(errorMessage(error, "Something went wrong, please try again"));
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPasswordRequest,
    onError: (error) => {
      toast.error(errorMessage(error, "This reset link is invalid or has expired"));
    },
  });
}
