"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthUser } from "../types";
import {
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useSetupTwoFactor,
} from "../hooks";

function EnableTwoFactorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const setup = useSetupTwoFactor();
  const confirm = useConfirmTwoFactor();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (open && !setup.data && !setup.isPending) {
      setup.mutate();
    }
    if (!open) {
      setCode("");
      setPassword("");
      setRecoveryCodes(null);
      setup.reset();
      confirm.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const secret = setup.data ? new URL(setup.data.otpauthUrl).searchParams.get("secret") : null;

  function onConfirm(event: React.FormEvent) {
    event.preventDefault();
    confirm.mutate(
      { code, password: password || undefined },
      { onSuccess: (result) => setRecoveryCodes(result.recoveryCodes) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {recoveryCodes ? (
          <>
            <DialogHeader>
              <DialogTitle>Save your recovery codes</DialogTitle>
              <DialogDescription>
                Each code can be used once to sign in if you lose access to your
                authenticator app. Store them somewhere safe — they won&apos;t be shown
                again.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
              {recoveryCodes.map((rc) => (
                <span key={rc}>{rc}</span>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>I&apos;ve saved these codes</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enable two-factor authentication</DialogTitle>
              <DialogDescription>
                Scan this QR code with an authenticator app (Google Authenticator, Authy,
                1Password, etc.), then enter the 6-digit code it generates.
              </DialogDescription>
            </DialogHeader>

            {setup.isPending && (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {setup.data && (
              <form onSubmit={onConfirm} className="grid gap-4">
                <div className="flex justify-center">
                  <Image
                    src={setup.data.qrCodeDataUrl}
                    alt="Two-factor setup QR code"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
                {secret && (
                  <p className="text-center text-xs text-muted-foreground">
                    Can&apos;t scan it? Enter this code manually:{" "}
                    <span className="font-mono">{secret}</span>
                  </p>
                )}
                <div className="grid gap-1.5">
                  <Label htmlFor="2fa-code">6-digit code</Label>
                  <Input
                    id="2fa-code"
                    autoFocus
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="2fa-password">Password</Label>
                  <Input
                    id="2fa-password"
                    type="password"
                    placeholder="Leave blank if you signed up with Google"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={confirm.isPending || !code}>
                    {confirm.isPending && <Loader2 className="size-4 animate-spin" />}
                    Confirm and enable
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisableTwoFactorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const disable = useDisableTwoFactor();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setCode("");
      setPassword("");
      disable.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    disable.mutate({ password, code }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Disable two-factor authentication</DialogTitle>
          <DialogDescription>
            This makes your account easier to break into if your password ever leaks.
            Confirm your password and a current code to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="disable-password">Password</Label>
            <Input
              id="disable-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disable-code">6-digit code or recovery code</Label>
            <Input id="disable-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={disable.isPending || !password || !code}>
              {disable.isPending && <Loader2 className="size-4 animate-spin" />}
              Disable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TwoFactorSettings({ user }: { user: AuthUser }) {
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  return (
    <Card className="max-w-xl p-5">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Two-factor authentication</CardTitle>
            <CardDescription>
              Require a code from an authenticator app in addition to your password.
            </CardDescription>
          </div>
          {user.twoFactorEnabled ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <ShieldCheck className="size-3.5" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <ShieldOff className="size-3.5" />
              Disabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-4 p-0">
        {user.twoFactorEnabled ? (
          <Button variant="outline" onClick={() => setDisableOpen(true)}>
            Disable two-factor authentication
          </Button>
        ) : (
          <Button onClick={() => setEnableOpen(true)}>Enable two-factor authentication</Button>
        )}
      </CardContent>

      <EnableTwoFactorDialog open={enableOpen} onOpenChange={setEnableOpen} />
      <DisableTwoFactorDialog open={disableOpen} onOpenChange={setDisableOpen} />
    </Card>
  );
}
