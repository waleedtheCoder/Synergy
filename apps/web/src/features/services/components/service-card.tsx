"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteService, useUpdateService } from "../hooks";
import type { Service } from "../types";
import { ServiceFormDialog } from "./service-form-dialog";

function formatPrice(service: Service) {
  if (service.priceType === "FIXED" && service.price) {
    return `$${Number(service.price).toLocaleString()}`;
  }
  if (service.minPrice || service.maxPrice) {
    const min = service.minPrice ? `$${Number(service.minPrice).toLocaleString()}` : null;
    const max = service.maxPrice ? `$${Number(service.maxPrice).toLocaleString()}` : null;
    return [min, max].filter(Boolean).join(" – ");
  }
  return "Quote on request";
}

export function ServiceCard({ service }: { service: Service }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const toggleActive = useUpdateService(service.id);
  const deleteService = useDeleteService();

  return (
    <Card className="p-5">
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">{service.title}</h3>
            {service.category && (
              <p className="text-xs text-muted-foreground">{service.category.name}</p>
            )}
          </div>
          <Badge
            variant={service.active ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleActive.mutate({ active: !service.active })}
          >
            {service.active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {service.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-sm font-medium text-foreground">{formatPrice(service)}</span>
          <div className="flex gap-2">
            <ServiceFormDialog
              service={service}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil />
                  Edit
                </Button>
              }
            />
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this service?</DialogTitle>
                  <DialogDescription>This cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Keep it
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteService.isPending}
                    onClick={() =>
                      deleteService.mutate(service.id, { onSuccess: () => setDeleteOpen(false) })
                    }
                  >
                    {deleteService.isPending && <Loader2 className="size-4 animate-spin" />}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
