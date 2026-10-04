"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageCircleQuestion, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiErrorMessage, useAiEnabled, useAskHelp } from "../hooks";
import { AiDisclaimer, CitedText, SourceList } from "./ai-answer";

const SUGGESTIONS = ["How do payments work?", "How do I post a project?", "What do the plans cost?"];

/** Floating "How does Synergi work?" assistant, answered from the help docs. */
export function HelpAssistantWidget() {
  const enabled = useAiEnabled();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const ask = useAskHelp();

  // Chat pages have their own input bar in the bottom-right corner.
  if (!enabled || pathname.includes("/messages/")) return null;

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || ask.isPending) return;
    setQuestion(trimmed);
    ask.mutate(trimmed);
  }

  return (
    // Sits above the homepage's mobile ad banner (fixed bottom-0, sm:hidden).
    <div className="fixed right-4 bottom-20 z-40 sm:bottom-4">
      {open ? (
        <div className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border border-border bg-background p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">Synergi help</p>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close help">
              <X />
            </Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {ask.isPending && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Looking that up…
              </p>
            )}
            {ask.error && !ask.isPending && <p className="text-sm text-destructive">{aiErrorMessage(ask.error)}</p>}
            {ask.data && !ask.isPending && (
              <>
                <CitedText text={ask.data.answer} />
                <SourceList
                  sources={ask.data.sources.map((source) => ({ n: source.n, label: source.title }))}
                />
                <AiDisclaimer className="mt-3" />
              </>
            )}
            {!ask.data && !ask.isPending && !ask.error && (
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">Ask anything about how Synergi works.</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submit(suggestion)}
                      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit(question);
            }}
          >
            <Input
              value={question}
              maxLength={500}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type a question…"
            />
            <Button type="submit" size="icon" disabled={!question.trim() || ask.isPending} aria-label="Ask">
              <Send />
            </Button>
          </form>
        </div>
      ) : (
        <Button className="rounded-full shadow-lg" onClick={() => setOpen(true)}>
          <MessageCircleQuestion />
          Help
        </Button>
      )}
    </div>
  );
}
