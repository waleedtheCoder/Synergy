"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiErrorMessage, useAiEnabled, useDisputeAssessment, useReportAssessment } from "../hooks";
import type { Confidence, ModerationPrecedent } from "../types";
import { AiDisclaimer, CitedText, SourceList } from "./ai-answer";

const STATUS_LABELS: Record<string, string> = {
  ACTIONED: "Action",
  DISMISSED: "Dismiss",
  RESOLVED: "Resolve",
  REJECTED: "Reject",
  UNDER_REVIEW: "Review further",
};

function Panel({
  suggestedStatus,
  confidence,
  reasoning,
  precedents,
  children,
}: {
  suggestedStatus: string;
  confidence: Confidence;
  reasoning: string;
  precedents: ModerationPrecedent[];
  children?: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Sparkles className="size-4 text-primary" />
        <span className="font-medium text-foreground">
          Suggestion: {STATUS_LABELS[suggestedStatus] ?? suggestedStatus}
        </span>
        <Badge variant="outline">{confidence} confidence</Badge>
      </div>
      <CitedText text={reasoning} />
      {children}
      <SourceList
        sources={precedents.map((precedent) => ({
          n: precedent.n,
          label: `Past case — ${precedent.status.toLowerCase().replace(/_/g, " ")}`,
          snippet: precedent.snippet,
        }))}
      />
      <AiDisclaimer />
    </div>
  );
}

function AssessButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="w-fit" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
      AI suggestion
    </Button>
  );
}

export function ReportAssessmentPanel({ reportId }: { reportId: string }) {
  const enabled = useAiEnabled();
  const [requested, setRequested] = useState(false);
  const { data, isFetching, error } = useReportAssessment(reportId, requested);

  if (!enabled) return null;
  if (!data) {
    return (
      <div className="grid gap-1">
        <AssessButton loading={isFetching} onClick={() => setRequested(true)} />
        {error && <p className="text-xs text-destructive">{aiErrorMessage(error)}</p>}
      </div>
    );
  }

  return (
    <Panel {...data}>
      {data.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.flags.map((flag) => (
            <Badge key={flag} variant="secondary">
              {flag}
            </Badge>
          ))}
        </div>
      )}
      {data.targetSummary && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Reported content:</span> {data.targetSummary}
        </p>
      )}
    </Panel>
  );
}

export function DisputeAssessmentPanel({ disputeId }: { disputeId: string }) {
  const enabled = useAiEnabled();
  const [requested, setRequested] = useState(false);
  const { data, isFetching, error } = useDisputeAssessment(disputeId, requested);

  if (!enabled) return null;
  if (!data) {
    return (
      <div className="grid gap-1">
        <AssessButton loading={isFetching} onClick={() => setRequested(true)} />
        {error && <p className="text-xs text-destructive">{aiErrorMessage(error)}</p>}
      </div>
    );
  }

  return (
    <Panel {...data}>
      {data.suggestedResolution && (
        <p className="rounded bg-background p-2 text-xs text-foreground">
          <span className="font-medium">Draft resolution notes:</span> {data.suggestedResolution}
        </p>
      )}
    </Panel>
  );
}
