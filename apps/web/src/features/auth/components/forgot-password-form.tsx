"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
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
import { useForgotPassword } from "../hooks";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    forgotPassword.mutate(values);
  }

  if (forgotPassword.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <MailCheck className="size-10 text-primary" />
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for that address, we&apos;ve sent a link to reset your password.
          </CardDescription>
          <Link href={ROUTES.login} className="mt-2 text-sm font-medium text-primary hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>We&apos;ll email you a link to reset it</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-2 h-10 w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending && <Loader2 className="size-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
