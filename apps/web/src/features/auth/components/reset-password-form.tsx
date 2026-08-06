"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ROUTES } from "@/constants/routes";
import { useResetPassword } from "../hooks";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "../schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { token: token ?? "", password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <ShieldAlert className="size-10 text-destructive" />
          <CardTitle className="text-xl">Invalid link</CardTitle>
          <CardDescription>
            This password reset link is missing its token. Request a new one below.
          </CardDescription>
          <Link
            href={ROUTES.forgotPassword}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  function onSubmit(values: ResetPasswordFormInput) {
    resetPassword.mutate(
      { token: values.token, password: values.password },
      {
        onSuccess: () => {
          toast.success("Password updated. Please log in.");
          router.push(ROUTES.login);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-2 h-10 w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending && <Loader2 className="size-4 animate-spin" />}
              Reset password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
