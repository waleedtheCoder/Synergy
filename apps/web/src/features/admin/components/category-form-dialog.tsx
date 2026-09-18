"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCategories, useCreateAdminCategory } from "@/features/admin/hooks";

export function CategoryFormDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  const { data: categories } = useAdminCategories();
  const createCategory = useCreateAdminCategory();

  function reset() {
    setName("");
    setIcon("");
    setParentId(undefined);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    createCategory.mutate(
      { name, icon: icon || undefined, parentId },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Plumbing"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category-icon">Icon (optional)</Label>
            <Input
              id="category-icon"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="lucide icon name"
            />
          </div>

          <div className="grid gap-2">
            <Label>Parent category (optional)</Label>
            <Select
              value={parentId ?? "none"}
              onValueChange={(value) => setParentId(value === "none" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="mt-2 w-fit" disabled={createCategory.isPending || !name}>
            {createCategory.isPending && <Loader2 className="size-4 animate-spin" />}
            Create category
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
