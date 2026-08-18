"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  Heart,
  LayoutGrid,
  ListChecks,
  Loader2,
  Menu,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { UserMenu } from "@/components/layout/site-header";
import { getChatSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks";

const NAV_ITEMS = [
  { href: ROUTES.clientDashboard, label: "Overview", icon: LayoutGrid },
  { href: ROUTES.dashboardRequests, label: "My requests", icon: ListChecks },
  { href: ROUTES.dashboardMessages, label: "Messages", icon: MessageSquare },
  { href: ROUTES.dashboardFavorites, label: "Favorites", icon: Heart },
  { href: ROUTES.dashboardSaved, label: "Saved", icon: Bookmark },
  { href: ROUTES.dashboardNotifications, label: "Notifications", icon: Bell },
  { href: ROUTES.dashboardSettings, label: "Settings", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data } = useNotifications({ unreadOnly: true });
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="size-4" />
              {item.label}
            </span>
            {item.href === ROUTES.dashboardNotifications && unreadCount > 0 && (
              <Badge className="h-5 min-w-5 justify-center px-1">{unreadCount}</Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace(ROUTES.login);
      return;
    }
    if (user.role !== "CLIENT") {
      router.replace(ROUTES.home);
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (!isHydrated || !user || user.role !== "CLIENT") return;
    const socket = getChatSocket();
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [isHydrated, user]);

  if (!isHydrated || !user || user.role !== "CLIENT") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-foreground lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link href={ROUTES.home} className="text-lg font-semibold tracking-tight text-foreground">
            Syn<span className="text-primary">ergi</span>
          </Link>
        </div>
        <UserMenu />
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-background p-4 lg:block">
          <SidebarNav />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-background/95 p-4 pt-20 lg:hidden">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
