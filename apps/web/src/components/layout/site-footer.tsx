import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const FOOTER_LINKS = {
  Company: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Categories", href: "#categories" },
  ],
  Clients: [{ label: "Find a professional", href: `${ROUTES.register}?role=CLIENT` }],
  Professionals: [
    { label: "Join Synergi", href: `${ROUTES.register}?role=PROFESSIONAL` },
    { label: "For professionals", href: "#for-professionals" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={ROUTES.home} className="text-xl font-semibold tracking-tight text-foreground">
              Syn<span className="text-primary">ergi</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The marketplace connecting homeowners with vetted construction professionals.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-semibold text-foreground">{heading}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Synergi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
