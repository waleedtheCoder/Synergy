"use client";

import { Calendar, Link as LinkIcon, Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MeetingStatus, MessageMeeting } from "@/features/chats/types";
import { useUpdateMeetingStatus } from "../hooks";

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  SCHEDULED: { label: "Scheduled", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  NO_SHOW: { label: "No-show", variant: "outline" },
};

export function MeetingCard({ meeting }: { meeting: MessageMeeting }) {
  const updateStatus = useUpdateMeetingStatus();
  const config = STATUS_CONFIG[meeting.status];

  return (
    <Card className="w-full max-w-sm p-4">
      <CardContent className="grid gap-3 p-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Meeting</p>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          {new Date(meeting.scheduledAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          <span>· {meeting.durationMins} min</span>
        </div>

        {meeting.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {meeting.location}
          </div>
        )}

        {meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <LinkIcon className="size-4" />
            Join link
          </a>
        )}

        {meeting.notes && <p className="text-sm text-muted-foreground">{meeting.notes}</p>}

        {meeting.status === "SCHEDULED" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: meeting.id, status: "COMPLETED" })}
            >
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Mark complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: meeting.id, status: "CANCELLED" })}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
