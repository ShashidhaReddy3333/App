"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setShow(true);
  }, []);

  useEffect(() => {
    if (show) {
      dialogRef.current?.focus();
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          localStorage.setItem("cookie-consent", "declined");
          setShow(false);
        }
      }}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-white p-4 shadow-lg md:mx-0"
    >
      <h2 id={titleId} className="text-sm font-semibold text-foreground">
        Cookie preferences
      </h2>
      <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
        We use essential cookies to keep you signed in and remember your preferences. No tracking
        cookies are used.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          aria-label="Accept essential cookies"
          onClick={() => {
            localStorage.setItem("cookie-consent", "accepted");
            setShow(false);
          }}
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-label="Decline optional cookie preferences"
          onClick={() => {
            localStorage.setItem("cookie-consent", "declined");
            setShow(false);
          }}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
