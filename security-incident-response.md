# Synergi — Security Incident Response Runbook

Last reviewed: 2026-09-21

**Contact / authority:** Solo project. Waleed Bin Aamer (waleedbinaamer2003@gmail.com)
is the sole point of contact and holds every credential this app depends on
(Supabase, Resend, Google OAuth, Sentry, JWT signing secrets, `ENCRYPTION_KEY`).
There is no on-call rotation or escalation chain to define — if something
happens, it lands on this one person. If the team ever grows, update this
section first, before anything else in this document.

This is a practical checklist, not a compliance document — it names the
actual tools this app already has (Sentry, admin audit log, Supabase
dashboard, refresh-token revocation) rather than generic advice.

---

## 1. Credential / secret leak (JWT secret, `ENCRYPTION_KEY`, API key, `.env` exposed)

**Signal:** A `.env` file, secret, or key shows up somewhere it shouldn't have
(committed to git, pasted publicly, leaked via a compromised machine).

1. **Rotate the specific leaked secret first**, not everything:
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate new values
     (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`),
     update `.env` on every environment that has one, restart the API.
     Rotating `JWT_REFRESH_SECRET` immediately invalidates every refresh
     token in the `RefreshToken` table (signature no longer verifies) — this
     signs every user out everywhere. Expected and correct for a real leak.
   - `ENCRYPTION_KEY` — rotating this **breaks decryption of existing 2FA
     TOTP secrets** (`twoFactorSecret` is encrypted with it). There's
     currently no re-encryption migration path. If this key leaks, the
     realistic response is: rotate it, then require every user with
     `twoFactorEnabled: true` to re-enroll in 2FA (their old secret becomes
     unrecoverable, which is actually the safe outcome — an attacker with the
     old key can no longer decrypt anything new either).
   - `SUPABASE_SERVICE_ROLE_KEY` — regenerate from Supabase dashboard →
     Settings → API. Update `.env` everywhere, restart the API.
   - `RESEND_API_KEY` / `GOOGLE_CLIENT_SECRET` / `SENTRY_DSN` / `TURNSTILE_SECRET_KEY`
     — regenerate from that service's own dashboard, update `.env`, restart.
2. **Force sign-out everywhere** if the leak could plausibly have let someone
   forge or steal live sessions: rotating `JWT_REFRESH_SECRET` (above)
   already does this for refresh tokens; any already-issued 15-minute access
   tokens simply expire on their own shortly after.
3. **Check git history** for whether the leak was ever committed
   (`git log -p --all | grep -i <the leaked value>`) — if so, the secret is
   compromised permanently even after rotation (git history can be rewritten,
   but treat the old value as burned regardless; don't rely on rewriting
   history as the fix).
4. **Check Sentry** (both `synergi-api` and `synergi-web` projects) for any
   errors around the leak window that might indicate the secret was already
   being actively used maliciously (unexpected auth failures, unusual spikes).

## 2. Database compromise / suspicious DB activity

**Signal:** Unexpected rows, data you didn't create, a Supabase alert, or
`SUPABASE_SERVICE_ROLE_KEY` is the thing that leaked (see §1).

1. From the Supabase dashboard, check **Database → Logs** for connections or
   queries you don't recognize.
2. Rotate `SUPABASE_SERVICE_ROLE_KEY` immediately (this is the app's only
   credential to the DB — see §1) — this alone cuts off any access using the
   old key.
3. Since the Postgres auto-generated Data API (PostgREST) is deliberately
   disabled and RLS is off (see `security.txt` §9), the service-role key
   rotating is the actual kill switch here — there's no separate RLS layer
   to also lock down.
4. Check `AdminAuditLog` (via `GET /api/v1/admin/audit-log` or directly in
   Supabase) for any admin actions you don't recognize in the relevant
   window — this is the only trail for privileged actions.
5. If data was actually altered or exfiltrated: Supabase's dashboard has
   point-in-time recovery depending on plan tier — check **Database →
   Backups** for what's actually available before assuming a restore is
   possible.

## 3. Account takeover report (a user says their account was accessed by someone else)

1. Confirm identity via the email on file (out-of-band if the account's own
   email may be compromised too).
2. Check that user's sessions: `GET /api/v1/auth/sessions` (as them, or via
   direct DB query on `RefreshToken` by `userId`) to see active sessions,
   IPs, user agents.
3. Revoke all their sessions: `POST /api/v1/auth/sessions/revoke-all` (as
   them) or directly set `revokedAt` on their `RefreshToken` rows in the DB
   if they can't log in to do it themselves.
4. Force a password reset (`/auth/forgot-password` flow) — this already
   revokes all refresh tokens as part of the reset (see `auth.service.ts`
   `resetPassword`).
5. Check `failedLoginAttempts`/`lockedUntil` on their `User` row for signs of
   a brute-force attempt that preceded the takeover.
6. If they have 2FA enabled and it was bypassed somehow, that's a signal to
   investigate further (see §5) rather than assume it's a one-off.

## 4. Admin account compromise (highest blast radius)

**Signal:** Unexpected entries in `AdminAuditLog`, an admin's 2FA/password
was reported stolen, or unusual admin-panel activity.

1. Immediately revoke all sessions for that admin account (see §3.3).
2. Force a password reset for that account.
3. Review `AdminAuditLog` for every action taken by that admin recently —
   user bans, payment confirmations/refunds, verification approvals, dispute
   resolutions all need manual review since they're real-world consequential
   actions, not just data changes.
4. Reverse anything found to be malicious (unban wrongly-banned users,
   reverse a fraudulent payment confirmation, etc.) — these are business
   actions, not something a DB rollback fixes.
5. Since ADMIN accounts require 2FA to access admin routes (see
   `security.txt` §15), confirm the compromise wasn't a bypass of that
   control specifically — if it was, that's a code-level bug, not just an
   incident to clean up after; stop and fix the guard before restoring access.

## 5. Dependency vulnerability disclosure (a package you use gets a CVE)

1. Check if CI's Dependabot/`pnpm audit` already flagged it — see
   `.github/dependabot.yml` and `.github/workflows/ci.yml`.
2. `pnpm audit --audit-level=high` locally for full detail.
3. Update the package, run the full verification chain
   (`pnpm db:generate && pnpm lint && pnpm type-check && pnpm test && pnpm build`)
   before deploying the fix.
4. If no patched version exists yet and the vulnerability is actually
   reachable in this app's usage of the package, consider a temporary
   mitigation (disabling the affected code path) rather than shipping with a
   known-exploitable dependency.

## 6. General principles

- **Rotate the specific thing that leaked, not everything reflexively** —
  over-rotating (e.g. rotating `ENCRYPTION_KEY` for a `JWT_ACCESS_SECRET`
  leak) causes unnecessary damage (breaks 2FA secrets for no reason in that
  example) without adding protection.
- **`AdminAuditLog` and Sentry are the only two sources of truth** this app
  currently has for "what happened." There's no centralized structured
  logging beyond these (see `security.txt` §14) — don't expect to find more
  than what's in the admin audit log, Sentry, and Supabase's own database
  logs.
- **This document has no tested backup/restore drill behind it** (see
  `security.txt` §9) — "restore from backup" above is aspirational until
  that's actually been verified against Supabase's real retention.
