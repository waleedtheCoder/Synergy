"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { useProfile, useUpdateProfile } from "@/features/dashboard/hooks";
import { updateProfileSchema, type UpdateProfileInput } from "@/features/dashboard/schemas";

export default function ProSettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: "", lastName: "", phone: undefined, address: undefined },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? undefined,
        address: undefined,
      });
    }
  }, [profile, form]);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account details." />

      <Card className="max-w-xl p-5">
        <CardContent className="p-0">
          <div className="mb-5 grid gap-1.5">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => updateProfile.mutate(values))}
              className="grid gap-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-2 w-fit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
