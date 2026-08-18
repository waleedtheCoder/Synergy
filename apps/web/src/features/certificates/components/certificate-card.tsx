"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, Trash2 } from "lucide-react";
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
import { useDeleteCertificate } from "../hooks";
import type { Certificate } from "../types";

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteCertificate = useDeleteCertificate();

  return (
    <Card className="p-5">
      <CardContent className="flex items-start justify-between gap-4 p-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{certificate.title}</h3>
            {certificate.verified && (
              <Badge variant="secondary">
                <BadgeCheck />
                Verified
              </Badge>
            )}
          </div>
          {certificate.issuer && (
            <p className="text-sm text-muted-foreground">{certificate.issuer}</p>
          )}
          {certificate.issueDate && (
            <p className="text-xs text-muted-foreground">
              Issued {new Date(certificate.issueDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 />
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove this certificate?</DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Keep it
              </Button>
              <Button
                variant="destructive"
                disabled={deleteCertificate.isPending}
                onClick={() =>
                  deleteCertificate.mutate(certificate.id, { onSuccess: () => setDeleteOpen(false) })
                }
              >
                {deleteCertificate.isPending && <Loader2 className="size-4 animate-spin" />}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
