import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3a7.4 7.4 0 0 1-11-3.9H1.06v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.07 14.19a7.2 7.2 0 0 1 0-4.38V6.72H1.06a12 12 0 0 0 0 10.56l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.06 6.72l4.01 3.09A7.16 7.16 0 0 1 12 4.77Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({ role }: { role?: "CLIENT" | "PROFESSIONAL" }) {
  const href = role
    ? `${env.NEXT_PUBLIC_API_URL}/auth/google?role=${role}`
    : `${env.NEXT_PUBLIC_API_URL}/auth/google`;

  return (
    <Button asChild variant="outline" className="h-10 w-full">
      <a href={href}>
        <GoogleIcon />
        Continue with Google
      </a>
    </Button>
  );
}
