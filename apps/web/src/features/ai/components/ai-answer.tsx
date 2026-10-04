import { Fragment } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Renders model text, turning inline [n] citations into small markers. */
export function CitedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className={cn("whitespace-pre-wrap text-sm leading-relaxed text-foreground", className)}>
      {parts.map((part, index) =>
        /^\[\d+\]$/.test(part) ? (
          <sup key={index} className="mx-0.5 rounded bg-accent px-1 text-[10px] font-medium text-primary">
            {part.slice(1, -1)}
          </sup>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </p>
  );
}

export function SourceList({ sources }: { sources: { n: number; label: string; snippet?: string }[] }) {
  if (sources.length === 0) return null;
  return (
    <ol className="mt-3 grid gap-1.5 border-t border-border/60 pt-3">
      {sources.map((source) => (
        <li key={source.n} className="flex gap-2 text-xs text-muted-foreground">
          <span className="mt-px shrink-0 rounded bg-accent px-1 text-[10px] font-medium text-primary">
            {source.n}
          </span>
          <span>
            <span className="font-medium text-foreground">{source.label}</span>
            {source.snippet && <> — {source.snippet}</>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
      <Sparkles className="size-3" />
      AI-generated — may be incomplete or wrong. Check important details.
    </p>
  );
}
