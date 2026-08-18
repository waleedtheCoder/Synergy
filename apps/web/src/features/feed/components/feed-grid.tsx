import type { FeedProject } from "../types";
import { FeedCard } from "./feed-card";

export function FeedGrid({ projects }: { projects: FeedProject[] }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {projects.map((project) => (
        <FeedCard key={project.id} project={project} />
      ))}
    </div>
  );
}
