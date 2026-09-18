"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CreditCard,
  Flag,
  LayoutGrid,
  ListTree,
  Loader2,
  Megaphone,
  Menu,
  Tags,
  Users,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { UserMenu } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: ROUTES.admin, label: "Overview", icon: LayoutGrid },
  { href: ROUTES.adminUsers, label: "Users", icon: Users },
  { href: ROUTES.adminVerification, label: "Verification", icon: BadgeCheck },
  { href: ROUTES.adminCategories, label: "Categories", icon: ListTree },
  { href: ROUTES.adminSkills, label: "Skills", icon: Tags },
  { href: ROUTES.adminReports, label: "Reports", icon: Flag },
  { href: ROUTES.adminDisputes, label: "Disputes", icon: AlertTriangle },
  { href: ROUTES.adminCampaigns, label: "Campaigns", icon: Megaphone },
  { href: ROUTES.adminPayments, label: "Payments", icon: CreditCard },
  { href: ROUTES.adminAnalytics, label: "Analytics", icon: BarChart3 },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
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
    if (user.role !== "ADMIN") {
      router.replace(ROUTES.home);
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || !user || user.role !== "ADMIN") {
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
            Syn<span className="text-primary">ergi</span>{" "}
            <span className="text-sm font-normal text-muted-foreground">Admin</span>
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
