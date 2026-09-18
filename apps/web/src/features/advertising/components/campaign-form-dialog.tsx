"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/features/uploads/components/file-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCampaign } from "../hooks";
import type { AdPlacement } from "../types";

const PLACEMENT_OPTIONS: { value: AdPlacement; label: string }[] = [
  { value: "HOMEPAGE_HERO", label: "Homepage hero" },
  { value: "HOMEPAGE_MIDDLE", label: "Homepage middle" },
  { value: "SEARCH_SIDEBAR", label: "Search sidebar" },
  { value: "PROFESSIONAL_PROFILE", label: "Professional profile" },
  { value: "PROJECT_FEED", label: "Project feed" },
  { value: "DASHBOARD", label: "Dashboard" },
  { value: "MOBILE_BANNER", label: "Mobile banner" },
];

export function CampaignFormDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<AdPlacement>("HOMEPAGE_HERO");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const createCampaign = useCreateCampaign();

  function reset() {
    setName("");
    setPlacement("HOMEPAGE_HERO");
    setBannerImageUrl("");
    setTargetUrl("");
    setBudget("");
    setStartDate("");
    setEndDate("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    createCampaign.mutate(
      {
        name,
        placement,
        bannerImageUrl,
        targetUrl,
        budget: Number(budget),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  }

  const isValid = name && bannerImageUrl && targetUrl && budget && startDate && endDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Placement</Label>
            <Select value={placement} onValueChange={(value) => setPlacement(value as AdPlacement)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Banner image</Label>
            <FileUpload
              value={bannerImageUrl}
              onChange={setBannerImageUrl}
              previewClassName="h-16 w-32"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="campaign-target">Target URL</Label>
            <Input
              id="campaign-target"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://…"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="campaign-budget">Budget (USD)</Label>
            <Input
              id="campaign-budget"
              type="number"
              min={10}
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-start">Start date</Label>
              <Input
                id="campaign-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-end">End date</Label>
              <Input
                id="campaign-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="mt-2 w-fit" disabled={createCampaign.isPending || !isValid}>
            {createCampaign.isPending && <Loader2 className="size-4 animate-spin" />}
            Create campaign
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
