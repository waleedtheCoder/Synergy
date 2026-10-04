import { PLAN_DEFINITIONS } from '../subscriptions/plans';

/**
 * Knowledge base for the help assistant (RAG over these docs).
 *
 * Every statement here must describe behavior the app actually has — the
 * assistant is instructed to answer only from these docs, so an inaccurate
 * line here becomes an inaccurate answer. Update this file alongside any
 * user-facing flow change. Docs are re-embedded automatically at startup
 * whenever their text changes.
 */
export interface HelpDoc {
  id: string;
  title: string;
  body: string;
}

const pricingBody = [
  'Professionals can choose a subscription plan from the Billing page of the professional dashboard. Clients do not need a plan.',
  ...PLAN_DEFINITIONS.map(
    (plan) =>
      `${plan.name} plan — ${plan.priceMonthly === 0 ? 'free' : `$${plan.priceMonthly} per month`}: ${plan.features.join('; ')}.`,
  ),
  'Paid plans run for 30 days from the moment an admin confirms the payment. There is no automatic re-billing: when the 30 days end, the account returns to the free Basic plan until a new payment is made.',
  'A professional can downgrade to Basic at any time from the Billing page; the downgrade is immediate and free.',
].join('\n');

export const HELP_DOCS: HelpDoc[] = [
  {
    id: 'about-synergi',
    title: 'What is Synergi?',
    body: `Synergi is a marketplace that connects clients (homeowners and businesses planning construction work) with construction professionals.
Clients can browse professionals, view their portfolios, services, certificates and reviews, post project requests, chat with professionals, and receive quotations.
Professionals get a public profile, a portfolio, a services list, a messaging inbox, quotation and meeting tools, and analytics about how their profile performs.
When registering, you choose whether you are a client or a professional. You can register with email and password or sign in with Google.`,
  },
  {
    id: 'finding-professionals',
    title: 'Finding a professional',
    body: `Use the Professionals page to search by keyword and filter by category, city, skills, availability, minimum rating, and verified status. Results can be sorted by rating, newest, or price.
Some results are marked "Sponsored": these are professionals running a paid advertising campaign and are clearly labeled.
The project feed shows portfolio projects from professionals; you can like, bookmark, and comment on them.
You can save professionals to your favorites from their profile page.
On a professional's public profile you can use the "Ask about" box to get AI answers drawn only from that profile's services, portfolio, certificates and reviews.`,
  },
  {
    id: 'project-requests',
    title: 'Posting a project request (clients)',
    body: `Clients post project requests from their dashboard (Requests → New request) with a title, description, optional budget range, timeline, category, city and address.
A request starts as Open. Only open requests can be edited or cancelled; cancelling cannot be undone.
When a client accepts a quotation linked to a request, the request moves to In progress and is awarded to that professional.
On an open request's page, "Find matching professionals" uses AI to recommend professionals whose work best fits the request and explains why each one matched.`,
  },
  {
    id: 'messaging-quotations-meetings',
    title: 'Messaging, quotations and meetings',
    body: `Clients and professionals communicate in a private chat. Starting a chat from a professional's profile requires being logged in.
Professionals send quotations from inside a chat: each quotation has line items (description, quantity, unit price), optional notes, and an optional valid-until date. The total is calculated automatically.
Only the client can accept or reject a quotation, and only while it is in the Sent state. The professional is notified of the decision.
Professionals can use "Draft with AI" in the quotation form to pre-fill line items based on the conversation and their own past quotations; they review and edit the draft before sending.
Either participant can schedule a meeting from the chat. A scheduled meeting can be marked completed, cancelled, or no-show.
Inside a chat, "Ask AI" can summarize the conversation or answer questions about what was discussed. Only the two participants can use it on their own chat.`,
  },
  {
    id: 'plans-pricing',
    title: 'Subscription plans and pricing',
    body: pricingBody,
  },
  {
    id: 'payments',
    title: 'How payments work',
    body: `Synergi does not process card payments. Payments are made offline by bank transfer or in person, then confirmed manually by a Synergi admin.
To pay, submit a payment claim (choose bank transfer or in person, and add a reference or note). The payment is Pending until an admin confirms it (Succeeded) or rejects it (Failed). You receive an email when your payment is confirmed, rejected, or refunded.
You cannot submit a second subscription payment while one is still pending.
Payment instructions are shown on the payment screens.`,
  },
  {
    id: 'refunds',
    title: 'Refunds',
    body: `Refunds are issued by a Synergi admin and only for payments that were confirmed (Succeeded). A refunded subscription payment returns the account to the Basic plan immediately. A refunded advertising payment ends the campaign if it was still running. You receive an email when a refund is issued.`,
  },
  {
    id: 'advertising',
    title: 'Advertising on Synergi',
    body: `Any logged-in user can become an advertiser from the "Advertise" link in the account menu.
Campaigns start as drafts. Submit a draft for review; an admin approves or rejects it. A campaign must be funded (its budget paid and confirmed by an admin) before it can be activated.
Ads appear in placements across the site, such as the homepage, search sidebar, project feed, dashboards, and professional profiles. A campaign can optionally boost a professional's listing in search results, where it is labeled Sponsored.
Spend is tracked per impression and per click. A campaign completes automatically when its spend reaches its budget or its end date passes. Advertisers can pause, resume, or stop an active campaign.`,
  },
  {
    id: 'verification',
    title: 'Verification badges',
    body: `Synergi admins review professionals and their uploaded certificates. Verified professionals show a verified badge on their profile, and verified certificates are marked Verified. In search, you can filter to verified professionals only.`,
  },
  {
    id: 'account-security',
    title: 'Account security and two-factor authentication',
    body: `You can turn on two-factor authentication (2FA) from your account settings. Setup shows a QR code for an authenticator app; confirming setup requires a code from the app and your account password. You also receive one-time recovery codes — store them safely.
Disabling 2FA also requires your password.
If you sign in with Google and have 2FA enabled, you are asked for your 2FA code after Google sign-in.
Admin accounts must have 2FA enabled to use the admin panel.
Registration, login and password reset are protected by a CAPTCHA.
If you forget your password, use "Forgot password" on the login page to receive a reset link by email.`,
  },
  {
    id: 'privacy',
    title: 'Privacy and your data',
    body: `Synergi's privacy policy and terms of service are available from the links in the site footer.
AI features send the relevant content (for example, the chat you ask about, or the public profile you ask about) to Anthropic's Claude API to generate an answer. Search indexes used by AI features are computed on Synergi's own servers.`,
  },
];
