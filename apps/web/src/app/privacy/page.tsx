import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Synergi collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="September 21, 2026">
      <p>
        This Privacy Policy explains how Synergi (&ldquo;Synergi&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, uses, and shares information when you use our website and
        services (the &ldquo;Service&rdquo;), which connect clients with construction
        professionals.
      </p>

      <section>
        <h2>Information we collect</h2>
        <p>We collect information you provide directly to us, including:</p>
        <ul>
          <li>
            Account information: name, email address, password (hashed), and role (client or
            professional) when you register, or your name, email, and profile photo when you
            sign in with Google.
          </li>
          <li>
            Profile and business information professionals choose to add: business name,
            services offered, skills, certificates, portfolio projects and images, and location.
          </li>
          <li>
            Content you create: project requests, quotations, meeting requests, chat messages,
            feed posts, comments, likes, bookmarks, and reviews.
          </li>
          <li>
            Files you upload: avatars, certificates, portfolio images, and project photos,
            stored with our storage provider (Supabase).
          </li>
          <li>
            Payment-related information: Synergi does not process card payments directly.
            Subscription and advertising payments are confirmed manually — we retain records of
            payment reference details you submit and their confirmation status, not full payment
            card data.
          </li>
        </ul>
        <p>We also collect information automatically:</p>
        <ul>
          <li>
            Usage and analytics events, such as profile views, search appearances, and ad
            impressions/clicks, used to show professionals and advertisers performance
            statistics.
          </li>
          <li>Standard technical data such as IP address, browser type, and device information.</li>
        </ul>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>To provide, operate, and maintain the Service, including matching clients with professionals.</li>
          <li>To enable messaging, quotations, and meeting scheduling between clients and professionals.</li>
          <li>To send transactional email (verification, password reset, payment confirmations) via our email provider (Resend).</li>
          <li>To power search and discovery of professional profiles.</li>
          <li>To review and moderate content, verify professional credentials, and enforce our Terms of Service.</li>
          <li>To show professionals and advertisers analytics about their own listings and campaigns.</li>
          <li>To detect, investigate, and prevent fraudulent or abusive activity.</li>
        </ul>
      </section>

      <section>
        <h2>How we share your information</h2>
        <p>We do not sell your personal information. We share information only:</p>
        <ul>
          <li>Between clients and professionals as necessary to facilitate a project (e.g., your name and message content are visible to the other party in a conversation).</li>
          <li>Publicly, where you choose to publish content, such as a professional profile, portfolio project, or feed post.</li>
          <li>With service providers who process data on our behalf, including our database host (Supabase), file storage provider (Supabase Storage), email provider (Resend), and authentication provider (Google, for Google sign-in).</li>
          <li>When required by law, or to protect the rights, safety, and property of Synergi, our users, or the public.</li>
        </ul>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We retain your information for as long as your account is active or as needed to
          provide the Service. You may request deletion of your account and associated personal
          data at any time by contacting us; some information may be retained where required for
          legal, security, or fraud-prevention purposes.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Depending on your location, you may have the right to access, correct, export, or
          delete your personal information, and to object to or restrict certain processing. You
          can exercise most of these rights directly from your account settings, or by contacting
          us using the details below.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect your information,
          including encrypted connections and hashed passwords. No method of transmission or
          storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Children&apos;s privacy</h2>
        <p>
          The Service is not directed to individuals under 18, and we do not knowingly collect
          personal information from children.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will update the &ldquo;Last
          updated&rdquo; date above when we do, and material changes will be communicated as
          required by law.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          Questions about this Privacy Policy can be sent to{" "}
          <a href="mailto:privacy@synergi.dev" className="text-primary hover:underline">
            privacy@synergi.dev
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
