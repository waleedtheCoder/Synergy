"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCategories } from "@/features/categories/hooks";
import { useSkills } from "@/features/skills/hooks";
import { cn } from "@/lib/utils";
import { useProfessionalProfile, useUpdateProfessionalProfile } from "../hooks";
import {
  professionalProfileSchema,
  toUpdateProfessionalProfilePayload,
  type ProfessionalProfileInput,
} from "../schemas";

const RESPONSE_TIME_OPTIONS = [
  { value: "WITHIN_HOUR", label: "Within an hour" },
  { value: "WITHIN_DAY", label: "Within a day" },
  { value: "WITHIN_WEEK", label: "Within a week" },
];

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "BUSY", label: "Busy" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

export function ProfileForm() {
  const { data: profile, isLoading } = useProfessionalProfile();
  const { data: categories } = useCategories();
  const { data: skills } = useSkills();
  const updateProfile = useUpdateProfessionalProfile();

  const form = useForm<ProfessionalProfileInput>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: {
      businessName: "",
      tagline: "",
      about: "",
      categoryId: undefined,
      yearsExperience: "",
      languages: "",
      responseTime: undefined,
      availability: "AVAILABLE",
      hourlyRateMin: "",
      hourlyRateMax: "",
      skillIds: [],
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        businessName: profile.businessName ?? "",
        tagline: profile.tagline ?? "",
        about: profile.about ?? "",
        categoryId: profile.categoryId ?? undefined,
        yearsExperience: profile.yearsExperience?.toString() ?? "",
        languages: profile.languages.join(", "),
        responseTime: profile.responseTime ?? undefined,
        availability: profile.availability,
        hourlyRateMin: profile.hourlyRateMin ?? "",
        hourlyRateMax: profile.hourlyRateMax ?? "",
        skillIds: profile.skills.map((skill) => skill.id),
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

  function onSubmit(values: ProfessionalProfileInput) {
    updateProfile.mutate(toUpdateProfessionalProfilePayload(values));
  }

  const selectedSkillIds = form.watch("skillIds");

  return (
    <Card className="max-w-2xl p-5">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Custom kitchens & renovations"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About</FormLabel>
                  <FormControl>
                    <Textarea rows={5} value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of experience</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responseTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical response time</FormLabel>
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select response time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESPONSE_TIME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABILITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourlyRateMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min hourly rate (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hourlyRateMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max hourly rate (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. English, Spanish"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Skills</FormLabel>
              <div className="flex flex-wrap gap-2">
                {skills?.map((skill) => {
                  const active = selectedSkillIds.includes(skill.id);
                  return (
                    <Badge key={skill.id} variant={active ? "default" : "outline"} asChild>
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue(
                            "skillIds",
                            active
                              ? selectedSkillIds.filter((id) => id !== skill.id)
                              : [...selectedSkillIds, skill.id],
                            { shouldDirty: true },
                          )
                        }
                        className={cn("cursor-pointer")}
                      >
                        {skill.name}
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </FormItem>

            <Button type="submit" className="mt-2 w-fit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
