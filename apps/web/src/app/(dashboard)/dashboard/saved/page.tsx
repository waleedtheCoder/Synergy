"use client";

import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useBookmarkedProjects } from "@/features/feed/hooks";
import { FeedGrid } from "@/features/feed/components/feed-grid";

export default function SavedProjectsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBookmarkedProjects({ page });

  return (
    <div>
      <PageHeader title="Saved" description="Projects you've bookmarked from the feed." />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Bookmark projects from the feed to find them here later."
        />
      )}

      {data && data.items.length > 0 && <FeedGrid projects={data.items} />}

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
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
  );
}
