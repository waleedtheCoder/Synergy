"use client";

import { useState } from "react";
import { ImageOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeletePortfolioProject, useUpdatePortfolioProject } from "../hooks";
import type { PortfolioProject } from "../types";
import { PortfolioFormDialog } from "./portfolio-form-dialog";

function formatBudget(project: PortfolioProject) {
  if (!project.budgetMin && !project.budgetMax) return null;
  const min = project.budgetMin ? `$${Number(project.budgetMin).toLocaleString()}` : null;
  const max = project.budgetMax ? `$${Number(project.budgetMax).toLocaleString()}` : null;
  if (min && max) return `${min} – ${max}`;
  return min ?? max;
}

export function PortfolioCard({ project }: { project: PortfolioProject }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const togglePublished = useUpdatePortfolioProject(project.id);
  const deleteProject = useDeletePortfolioProject();
  const cover = project.images[0];
  const budget = formatBudget(project);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex aspect-video items-center justify-center bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt={cover.caption ?? project.title} className="size-full object-cover" />
        ) : (
          <ImageOff className="size-8 text-muted-foreground" />
        )}
      </div>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground">{project.title}</h3>
          <Badge
            variant={project.published ? "default" : "outline"}
            className="cursor-pointer shrink-0"
            onClick={() => togglePublished.mutate({ published: !project.published })}
          >
            {project.published ? "Published" : "Draft"}
          </Badge>
        </div>

        {project.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {budget && <span>{budget}</span>}
          {project.location && <span>{project.location}</span>}
          {project.category && <span>{project.category.name}</span>}
        </div>

        <div className="flex gap-2 border-t border-border/60 pt-3">
          <PortfolioFormDialog
            project={project}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil />
                Edit
              </Button>
            }
          />
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this portfolio project?</DialogTitle>
                <DialogDescription>This cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteProject.isPending}
                  onClick={() =>
                    deleteProject.mutate(project.id, { onSuccess: () => setDeleteOpen(false) })
                  }
                >
                  {deleteProject.isPending && <Loader2 className="size-4 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
