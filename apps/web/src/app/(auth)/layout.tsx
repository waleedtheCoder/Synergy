import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <Link
        href={ROUTES.home}
        className="mb-8 text-2xl font-semibold tracking-tight text-foreground"
      >
        Syn<span className="text-primary">ergi</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
