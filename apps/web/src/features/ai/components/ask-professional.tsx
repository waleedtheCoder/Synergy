"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { aiErrorMessage, useAiEnabled, useAskAboutProfessional } from "../hooks";
import { AiDisclaimer, CitedText, SourceList } from "./ai-answer";

const SUGGESTIONS = [
  "What kind of projects have they done?",
  "What do clients say about them?",
  "Are they certified?",
];

export function AskProfessional({ professionalId, name }: { professionalId: string; name: string }) {
  const enabled = useAiEnabled();
  const [question, setQuestion] = useState("");
  const ask = useAskAboutProfessional(professionalId);

  if (!enabled) return null;

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || ask.isPending) return;
    setQuestion(trimmed);
    ask.mutate(trimmed);
  }

  return (
    <Card className="mt-10 p-5">
      <CardContent className="grid gap-3 p-0">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Ask about {name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Answers come only from this profile&apos;s services, portfolio, certificates and reviews.
          </p>
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
            placeholder="e.g. Have they done kitchen remodels?"
          />
          <Button type="submit" size="icon" disabled={!question.trim() || ask.isPending} aria-label="Ask">
            {ask.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>

        {!ask.data && !ask.isPending && (
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
        )}

        {ask.error && <p className="text-sm text-destructive">{aiErrorMessage(ask.error)}</p>}

        {ask.data && (
          <div className="rounded-lg bg-muted/50 p-3">
            <CitedText text={ask.data.answer} />
            <SourceList sources={ask.data.sources} />
            <AiDisclaimer className="mt-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
