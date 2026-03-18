export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 18, 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p className="mt-2">
            We collect information you provide directly, including name, email address, business
            details, and transaction data necessary to operate the commerce platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="mt-2">
            We use collected information to provide and improve our services, process transactions,
            send communications, and ensure platform security.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Data Protection</h2>
          <p className="mt-2">
            We implement industry-standard security measures including encryption, secure session
            management, and access controls to protect your personal information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Cookies</h2>
          <p className="mt-2">
            We use essential cookies for authentication and session management. These cookies are
            necessary for the platform to function properly.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Third-Party Services</h2>
          <p className="mt-2">
            We may employ third-party services for payment processing and email delivery. These
            services have access only to the information necessary to perform their functions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this privacy policy from time to time. We will notify you of any changes
            by posting the new policy on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
