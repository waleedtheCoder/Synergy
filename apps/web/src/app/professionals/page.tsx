"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { useCategories } from "@/features/categories/hooks";
import { useSkills } from "@/features/skills/hooks";
import { useSearchProfessionals } from "@/features/search/hooks";
import { ProfessionalSearchCard } from "@/features/search/components/professional-search-card";
import type { AvailabilityStatus, SearchSort } from "@/features/search/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
];

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "BUSY", label: "Busy" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

const MIN_RATING_OPTIONS = [
  { value: "0", label: "Any rating" },
  { value: "3", label: "3+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "4.5", label: "4.5+ stars" },
];

export default function SearchProfessionalsPage() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilityStatus | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SearchSort>("relevance");
  const [page, setPage] = useState(1);

  const debouncedQ = useDebouncedValue(q, 300);
  const { data: categories } = useCategories();
  const { data: skills } = useSkills();
  const { data, isLoading } = useSearchProfessionals({
    q: debouncedQ || undefined,
    categoryId,
    skillIds: skillIds.length > 0 ? skillIds : undefined,
    availability,
    verifiedOnly: verifiedOnly || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    sort,
    page,
  });

  function resetPage() {
    setPage(1);
  }

  function toggleSkill(id: string) {
    setSkillIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));
    resetPage();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Find professionals</h1>
          <p className="mt-1 text-muted-foreground">Search and filter verified construction professionals.</p>

          <div className="mt-6 grid gap-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  resetPage();
                }}
                placeholder="Search by name, skill, or specialty…"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Select
                value={categoryId ?? "all"}
                onValueChange={(value) => {
                  setCategoryId(value === "all" ? undefined : value);
                  resetPage();
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={availability ?? "any"}
                onValueChange={(value) => {
                  setAvailability(value === "any" ? undefined : (value as AvailabilityStatus));
                  resetPage();
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Any availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any availability</SelectItem>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(minRating)}
                onValueChange={(value) => {
                  setMinRating(Number(value));
                  resetPage();
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MIN_RATING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value as SearchSort);
                  resetPage();
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge
                variant={verifiedOnly ? "default" : "outline"}
                className="h-9 cursor-pointer px-3"
                onClick={() => {
                  setVerifiedOnly((v) => !v);
                  resetPage();
                }}
              >
                Verified only
              </Badge>
            </div>

            {skills && skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={skillIds.includes(skill.id) ? "default" : "outline"}
                    className={cn("cursor-pointer")}
                    onClick={() => toggleSkill(skill.id)}
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            {isLoading && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && data && data.items.length === 0 && (
              <p className="py-24 text-center text-muted-foreground">
                No professionals matched your search.
              </p>
            )}

            {data && data.items.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((hit) => (
                  <ProfessionalSearchCard key={hit.id} hit={hit} />
                ))}
              </div>
            )}

            {data && data.meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
