"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, Heart, ImageOff, Loader2, MapPin, Send, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { cn } from "@/lib/utils";
import {
  useAddFeedComment,
  useBookmarkProject,
  useFeedComments,
  useFeedProject,
  useLikeProject,
} from "@/features/feed/hooks";
import { professionalName } from "@/features/feed/participant-name";

function formatBudget(budgetMin: string | null, budgetMax: string | null) {
  if (!budgetMin && !budgetMax) return null;
  const min = budgetMin ? `$${Number(budgetMin).toLocaleString()}` : null;
  const max = budgetMax ? `$${Number(budgetMax).toLocaleString()}` : null;
  return min && max ? `${min} – ${max}` : (min ?? max);
}

export default function FeedProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: project, isLoading } = useFeedProject(params.id);
  const { data: comments } = useFeedComments(params.id, { page: 1 });
  const likeProject = useLikeProject();
  const bookmarkProject = useBookmarkProject();
  const addComment = useAddFeedComment(params.id);
  const [commentDraft, setCommentDraft] = useState("");

  function requireAuth(action: () => void) {
    if (!user) {
      router.push(ROUTES.login);
      return;
    }
    action();
  }

  function handleAddComment() {
    const content = commentDraft.trim();
    if (!content) return;
    addComment.mutate(content, { onSuccess: () => setCommentDraft("") });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {isLoading || !project ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[3fr_2fr] lg:px-8">
            <div className="grid gap-3">
              {project.images.length > 0 ? (
                project.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.caption ?? project.title}
                    className="w-full rounded-2xl object-cover"
                  />
                ))
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted">
                  <ImageOff className="size-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.title}</h1>

              <Link
                href={`${ROUTES.professional}/${project.professional.slug}`}
                className="mt-4 flex items-center gap-3"
              >
                <Avatar>
                  <AvatarFallback className="bg-accent font-medium text-primary">
                    {project.professional.user.firstName.charAt(0)}
                    {project.professional.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{professionalName(project.professional)}</p>
                  <p className="text-sm text-muted-foreground">View profile</p>
                </div>
              </Link>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  onClick={() =>
                    requireAuth(() => likeProject.mutate({ id: project.id, liked: project.isLiked }))
                  }
                >
                  <Heart className={cn("size-5", project.isLiked && "fill-primary text-primary")} />
                  {project.likesCount}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  onClick={() =>
                    requireAuth(() =>
                      bookmarkProject.mutate({ id: project.id, bookmarked: project.isBookmarked }),
                    )
                  }
                >
                  <Bookmark className={cn("size-5", project.isBookmarked && "fill-primary text-primary")} />
                  {project.bookmarksCount}
                </button>
              </div>

              {project.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{project.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {formatBudget(project.budgetMin, project.budgetMax) && (
                  <span className="flex items-center gap-1.5">
                    <Wallet className="size-4" />
                    {formatBudget(project.budgetMin, project.budgetMax)}
                  </span>
                )}
                {project.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {project.location}
                  </span>
                )}
                {project.category && <span>{project.category.name}</span>}
              </div>

              <div className="mt-8">
                <h2 className="mb-3 font-semibold text-foreground">Comments</h2>

                {user && (
                  <div className="mb-4 flex gap-2">
                    <Textarea
                      rows={2}
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Add a comment…"
                      className="resize-none"
                    />
                    <Button size="icon" onClick={handleAddComment} disabled={!commentDraft.trim()}>
                      <Send />
                    </Button>
                  </div>
                )}

                <div className="grid gap-3">
                  {comments?.items.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-accent text-xs font-medium text-primary">
                          {comment.user.firstName.charAt(0)}
                          {comment.user.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {comment.user.firstName} {comment.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments && comments.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
