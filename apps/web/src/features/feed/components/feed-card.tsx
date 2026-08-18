"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, ImageOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { cn } from "@/lib/utils";
import { useBookmarkProject, useLikeProject } from "../hooks";
import { professionalName } from "../participant-name";
import type { FeedProject } from "../types";

export function FeedCard({ project }: { project: FeedProject }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const likeProject = useLikeProject();
  const bookmarkProject = useBookmarkProject();
  const cover = project.images[0];

  function requireAuth(action: () => void) {
    if (!user) {
      router.push(ROUTES.login);
      return;
    }
    action();
  }

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border/60 bg-background">
      <Link href={`${ROUTES.feed}/${project.id}`} className="block">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt={cover.caption ?? project.title} className="w-full object-cover" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-muted">
            <ImageOff className="size-8 text-muted-foreground" />
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={`${ROUTES.feed}/${project.id}`}>
          <h3 className="line-clamp-2 font-semibold text-foreground">{project.title}</h3>
        </Link>

        <Link href={`${ROUTES.professional}/${project.professional.slug}`} className="mt-2 flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-accent text-xs font-medium text-primary">
              {project.professional.user.firstName.charAt(0)}
              {project.professional.user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm text-muted-foreground">
            {professionalName(project.professional)}
          </span>
        </Link>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
            onClick={() =>
              requireAuth(() => likeProject.mutate({ id: project.id, liked: project.isLiked }))
            }
          >
            <Heart className={cn("size-4", project.isLiked && "fill-primary text-primary")} />
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
            <Bookmark className={cn("size-4", project.isBookmarked && "fill-primary text-primary")} />
            {project.bookmarksCount}
          </button>
        </div>
      </div>
    </div>
  );
}
