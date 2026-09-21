import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Synergi.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="September 21, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Synergi
        (&ldquo;Synergi&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or
        using the Service, you agree to these Terms.
      </p>

      <section>
        <h2>1. The Service</h2>
        <p>
          Synergi is a marketplace that connects clients seeking construction and trade work with
          independent professionals who offer it. Synergi facilitates discovery, messaging,
          quotations, and scheduling between clients and professionals, but is not a party to any
          contract for work formed between them.
        </p>
      </section>

      <section>
        <h2>2. Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account and keep it up to date.</li>
          <li>You are responsible for all activity that occurs under your account and for keeping your password secure.</li>
          <li>You must be at least 18 years old to create an account.</li>
          <li>Synergi accounts registered as &ldquo;professional&rdquo; represent that the account holder is authorized to offer the listed services.</li>
        </ul>
      </section>

      <section>
        <h2>3. Professional verification</h2>
        <p>
          Synergi may allow professionals to submit certificates and other credentials for
          review, and may display a &ldquo;verified&rdquo; badge where appropriate. Verification
          reflects that submitted documentation was reviewed by our team; it is not a guarantee of
          a professional&apos;s quality of work, licensing status, or fitness for any particular
          project, and clients are responsible for their own diligence before engaging a
          professional.
        </p>
      </section>

      <section>
        <h2>4. Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Post false, misleading, or infringing content, including in profiles, portfolios, or reviews.</li>
          <li>Use the Service to harass, defraud, or harm another user.</li>
          <li>Attempt to circumvent Synergi&apos;s moderation, verification, or payment-confirmation processes.</li>
          <li>Scrape, reverse-engineer, or interfere with the operation of the Service.</li>
        </ul>
        <p>
          We may review, remove content, suspend, or terminate accounts that violate these Terms,
          including through our reports and disputes review process.
        </p>
      </section>

      <section>
        <h2>5. Payments</h2>
        <p>
          Professional subscription plans and advertising campaigns are paid features. Synergi
          currently uses a manual payment-confirmation process: you submit payment reference
          details for a transfer made outside the Service, and our team confirms or rejects the
          payment. Access to paid features is granted upon confirmation. Synergi does not store
          full payment card numbers. Refunds, where granted, are processed at Synergi&apos;s
          discretion and reflected in your payment history.
        </p>
      </section>

      <section>
        <h2>6. Content and intellectual property</h2>
        <p>
          You retain ownership of content you submit (profiles, portfolio images, messages, feed
          posts). By posting content, you grant Synergi a non-exclusive, worldwide, royalty-free
          license to host, display, and distribute it as necessary to operate and promote the
          Service. You represent that you have the rights to any content you upload.
        </p>
      </section>

      <section>
        <h2>7. Disclaimers</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind. Synergi does
          not guarantee the accuracy of professional listings, the outcome of any project, or that
          the Service will be uninterrupted or error-free. Synergi is not responsible for the
          quality, safety, legality, or performance of any work arranged between clients and
          professionals.
        </p>
      </section>

      <section>
        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Synergi will not be liable for indirect,
          incidental, special, or consequential damages arising from your use of the Service, or
          from any dispute between clients and professionals.
        </p>
      </section>

      <section>
        <h2>9. Termination</h2>
        <p>
          You may stop using the Service and close your account at any time. We may suspend or
          terminate your access if you violate these Terms or if required by law.
        </p>
      </section>

      <section>
        <h2>10. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. We will update the &ldquo;Last
          updated&rdquo; date above when we do; continued use of the Service after changes take
          effect constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>11. Contact us</h2>
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:legal@synergi.dev" className="text-primary hover:underline">
            legal@synergi.dev
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
