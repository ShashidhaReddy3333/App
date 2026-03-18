"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white p-4 shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border">
      <p className="text-sm text-muted-foreground">
        We use essential cookies to keep you signed in and remember your preferences. No tracking cookies are used.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
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
