"use client";

import { ListTree, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminCategories, useDeleteAdminCategory } from "@/features/admin/hooks";
import { CategoryFormDialog } from "@/features/admin/components/category-form-dialog";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const deleteCategory = useDeleteAdminCategory();

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage the categories professionals and clients choose from."
        action={<CategoryFormDialog />}
      />

      {!isLoading && categories && categories.length === 0 && (
        <EmptyState icon={ListTree} title="No categories yet" description="Create the first one." />
      )}

      <div className="grid gap-3">
        {categories?.map((category) => {
          const parent = categories.find((c) => c.id === category.parentId);
          return (
            <Card key={category.id} className="p-4">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-foreground">{category.name}</p>
                  {parent && <Badge variant="outline">under {parent.name}</Badge>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory.mutate(category.id)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
