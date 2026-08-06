"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useRegister } from "../hooks";
import { registerSchema, type RegisterInput } from "../schemas";

const ROLE_OPTIONS = [
  {
    value: "CLIENT" as const,
    label: "I'm hiring",
    description: "Find and manage construction professionals",
    icon: User,
  },
  {
    value: "PROFESSIONAL" as const,
    label: "I'm a professional",
    description: "Showcase your work and win new projects",
    icon: Briefcase,
  },
];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const register = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: requestedRole === "PROFESSIONAL" ? "PROFESSIONAL" : "CLIENT",
    },
  });

  function onSubmit(values: RegisterInput) {
    register.mutate(values, {
      onSuccess: () => router.push(ROUTES.home),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Join Synergi as a client or professional</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-3"
                    >
                      {ROLE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <Label
                            key={option.value}
                            htmlFor={`role-${option.value}`}
                            className={cn(
                              "flex cursor-pointer flex-col gap-2 rounded-2xl border border-input p-4 transition-colors hover:bg-muted",
                              field.value === option.value &&
                                "border-primary bg-accent ring-1 ring-primary",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className="size-5 text-primary" />
                              <RadioGroupItem value={option.value} id={`role-${option.value}`} />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {option.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-2 h-10 w-full" disabled={register.isPending}>
              {register.isPending && <Loader2 className="size-4 animate-spin" />}
              Create account
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
