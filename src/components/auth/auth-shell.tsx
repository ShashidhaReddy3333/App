import Link from "next/link";

export function AuthShell({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="bg-black py-4 px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">Human Pulse</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
