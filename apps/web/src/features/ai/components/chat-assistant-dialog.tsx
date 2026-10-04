"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { aiErrorMessage, useAiEnabled, useAskAboutChat } from "../hooks";
import { AiDisclaimer, CitedText } from "./ai-answer";

export function ChatAssistantDialog({ chatId }: { chatId: string }) {
  const enabled = useAiEnabled();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const ask = useAskAboutChat(chatId);

  if (!enabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Sparkles />
          Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask about this conversation</DialogTitle>
          <DialogDescription>
            Get a summary or look something up in this chat. Only the two of you can use this on your chat.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Button
            variant="secondary"
            className="w-fit"
            disabled={ask.isPending}
            onClick={() => ask.mutate(undefined)}
          >
            Summarize the conversation
          </Button>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (question.trim()) ask.mutate(question.trim());
            }}
          >
            <Input
              value={question}
              maxLength={500}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. What price did we agree on?"
            />
            <Button type="submit" size="icon" disabled={!question.trim() || ask.isPending} aria-label="Ask">
              <Send />
            </Button>
          </form>

          {ask.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Reading the conversation…
            </p>
          )}
          {ask.error && !ask.isPending && <p className="text-sm text-destructive">{aiErrorMessage(ask.error)}</p>}
          {ask.data && !ask.isPending && (
            <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-muted/50 p-3">
              <CitedText text={ask.data.answer} />
              {ask.data.partial && (
                <p className="mt-2 text-xs text-muted-foreground">
                  This chat is long ({ask.data.messageCount} messages), so the answer is based on the most relevant and
                  most recent ones.
                </p>
              )}
              <AiDisclaimer className="mt-3" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
