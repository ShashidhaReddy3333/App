export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 18, 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing and using Human Pulse Commerce Operating System, you accept and agree to be
            bound by the terms and provisions of this agreement.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Use License</h2>
          <p className="mt-2">
            Permission is granted to temporarily use this software for personal or commercial
            business operations. This license does not include modifying, distributing, or
            reverse-engineering the software.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Disclaimer</h2>
          <p className="mt-2">
            The software is provided &quot;as is&quot; without warranty of any kind. We do not
            warrant that the service will be uninterrupted, timely, secure, or error-free.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Limitations</h2>
          <p className="mt-2">
            In no event shall Human Pulse or its suppliers be liable for any damages arising out of
            the use or inability to use the software.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Governing Law</h2>
          <p className="mt-2">
            These terms shall be governed by and construed in accordance with applicable local laws.
          </p>
        </section>
      </div>
    </div>
  );
}
