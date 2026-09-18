"use client";

import { useState } from "react";
import { Loader2, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminSkills, useCreateAdminSkill, useDeleteAdminSkill } from "@/features/admin/hooks";

export default function AdminSkillsPage() {
  const [name, setName] = useState("");
  const { data: skills, isLoading } = useAdminSkills();
  const createSkill = useCreateAdminSkill();
  const deleteSkill = useDeleteAdminSkill();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    createSkill.mutate(name, { onSuccess: () => setName("") });
  }

  return (
    <div>
      <PageHeader title="Skills" description="Manage the skill tags professionals can add to their profile." />

      <form onSubmit={onSubmit} className="mb-6 flex max-w-md gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Pipe Fitting"
          required
        />
        <Button type="submit" disabled={createSkill.isPending || !name}>
          {createSkill.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus />}
          Add
        </Button>
      </form>

      {!isLoading && skills && skills.length === 0 && (
        <EmptyState icon={Tags} title="No skills yet" description="Add the first one above." />
      )}

      <div className="flex flex-wrap gap-2">
        {skills?.map((skill) => (
          <Badge key={skill.id} variant="outline" className="h-8 gap-2 rounded-full px-3 text-sm">
            {skill.name}
            <button
              onClick={() => deleteSkill.mutate(skill.id)}
              aria-label={`Remove ${skill.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
