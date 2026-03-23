"use client";

import { useState } from "react";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EmailSmokeTemplate = {
  value: string;
  label: string;
  description: string;
};

type EmailSmokePreview = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function AdminEmailSmokeTestCard({
  templates,
  defaultRecipient,
}: {
  templates: readonly EmailSmokeTemplate[];
  defaultRecipient: string;
}) {
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipient);
  const [template, setTemplate] = useState(templates[0]?.value ?? "");
  const [preview, setPreview] = useState<EmailSmokePreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<"preview" | "send" | null>(null);

  const activeTemplate = templates.find((entry) => entry.value === template) ?? null;

  async function submit(mode: "preview" | "send") {
    setPendingMode(mode);
    setError(null);
    setMessage(null);

    try {
      const response = await requestJson<{
        preview: EmailSmokePreview;
        template: string;
        mode: "preview" | "send";
      }>("/api/admin/email-smoke-test", {
        method: "POST",
        body: JSON.stringify({
          recipientEmail,
          template,
          mode,
        }),
      });

      setPreview(response.preview);
      setMessage(mode === "send" ? "Smoke-test email sent." : "Smoke-test preview generated.");
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiClientError
          ? submissionError.message
          : "Unable to run the email smoke test."
      );
    } finally {
      setPendingMode(null);
    }
  }

  return (
    <Card id="email-smoke-test">
      <CardHeader>
        <CardTitle>Email smoke test</CardTitle>
        <CardDescription>
          Preview or send a real template through the configured provider to verify launch-ready
          email delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smoke-email-recipient">Recipient email</Label>
            <Input
              id="smoke-email-recipient"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="ops@human-pulse.com"
              disabled={pendingMode !== null}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smoke-email-template">Template</Label>
            <Select
              id="smoke-email-template"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              disabled={pendingMode !== null}
            >
              {templates.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {activeTemplate ? (
          <div className="rounded-[18px] border border-border/30 bg-[hsl(var(--surface-low))] px-4 py-3 text-sm text-muted-foreground">
            {activeTemplate.description}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void submit("preview")}
            disabled={pendingMode !== null || !template || !recipientEmail}
          >
            {pendingMode === "preview" ? "Generating preview..." : "Preview template"}
          </Button>
          <Button
            type="button"
            onClick={() => void submit("send")}
            disabled={pendingMode !== null || !template || !recipientEmail}
          >
            {pendingMode === "send" ? "Sending..." : "Send smoke email"}
          </Button>
        </div>

        {message ? (
          <div className="rounded-[18px] border border-emerald-500/25 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-[18px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {preview ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smoke-email-subject">Subject</Label>
              <Input id="smoke-email-subject" value={preview.subject} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smoke-email-to">Preview recipient</Label>
              <Input id="smoke-email-to" value={preview.to} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smoke-email-text">Plain text</Label>
              <Textarea id="smoke-email-text" value={preview.text} readOnly rows={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smoke-email-html">HTML</Label>
              <Textarea id="smoke-email-html" value={preview.html} readOnly rows={10} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
