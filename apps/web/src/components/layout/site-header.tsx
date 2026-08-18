"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useLogout } from "@/features/auth/hooks";

const NAV_LINKS = [
  { href: ROUTES.professional, label: "Find professionals" },
  { href: ROUTES.feed, label: "Feed" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#categories", label: "Categories" },
  { href: "#for-professionals", label: "For professionals" },
];

export function dashboardRoute(role: string) {
  if (role === "PROFESSIONAL") return ROUTES.professionalDashboard;
  if (role === "ADMIN") return ROUTES.admin;
  return ROUTES.clientDashboard;
}

function initialsOf(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-primary/40 transition-shadow focus-visible:ring-2">
          <Avatar>
            <AvatarFallback className="bg-accent font-medium text-primary">
              {initialsOf(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(dashboardRoute(user.role))}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => logout.mutate(undefined, { onSuccess: () => router.push(ROUTES.home) })}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} className="text-xl font-semibold tracking-tight text-foreground">
          Syn<span className="text-primary">ergi</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isHydrated && user ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href={ROUTES.login}>Log in</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.register}>Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="flex items-center justify-center rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background px-4 pb-6 md:hidden">
          <nav className="flex flex-col gap-1 pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Separator className="my-4" />
          {isHydrated && user ? (
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link href={dashboardRoute(user.role)} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link href={ROUTES.login} onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.register} onClick={() => setMobileOpen(false)}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
