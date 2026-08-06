"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ROUTES } from "@/constants/routes";
import { useCategories } from "@/features/categories/hooks";
import { useCreateProjectRequest } from "../hooks";
import {
  projectRequestSchema,
  toCreateProjectRequestPayload,
  type ProjectRequestInput,
} from "../schemas";

export function RequestForm() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createRequest = useCreateProjectRequest();

  const form = useForm<ProjectRequestInput>({
    resolver: zodResolver(projectRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      budgetMin: "",
      budgetMax: "",
      timeline: "",
      categoryId: undefined,
      address: "",
    },
  });

  function onSubmit(values: ProjectRequestInput) {
    createRequest.mutate(toCreateProjectRequestPayload(values), {
      onSuccess: () => router.push(ROUTES.dashboardRequests),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-2xl gap-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Kitchen renovation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Describe the scope of work, materials, and any specifics professionals should know."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budgetMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min budget (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max budget (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="timeline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Within 2 months" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Project location" value={field.value ?? ""} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={createRequest.isPending}>
            {createRequest.isPending && <Loader2 className="size-4 animate-spin" />}
            Post project request
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
