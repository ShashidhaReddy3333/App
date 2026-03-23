import { z } from "zod";

import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import {
  buildEmailSmokeTestMessage,
  EMAIL_SMOKE_TEST_TEMPLATES,
  sendEmailSmokeTest,
} from "@/lib/auth/mailer";
import { requiresEmailDelivery } from "@/lib/env";
import { conflictError } from "@/lib/errors";
import { apiError, apiSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

const emailSmokeTestTemplateValues = EMAIL_SMOKE_TEST_TEMPLATES.map(
  (template) => template.value
) as [
  (typeof EMAIL_SMOKE_TEST_TEMPLATES)[number]["value"],
  ...(typeof EMAIL_SMOKE_TEST_TEMPLATES)[number]["value"][],
];

const emailSmokeTestSchema = z.object({
  recipientEmail: z.string().email(),
  template: z.enum(emailSmokeTestTemplateValues),
  mode: z.enum(["preview", "send"]).default("preview"),
});

export async function POST(request: Request) {
  try {
    await requirePlatformAdminAccess(request);
    const payload = emailSmokeTestSchema.parse(await request.json());
    const preview = buildEmailSmokeTestMessage(payload.recipientEmail, payload.template);

    if (payload.mode === "send") {
      if (!requiresEmailDelivery()) {
        throw conflictError(
          "Email sending is disabled in demo mode. Switch DEMO_MODE to false to send smoke-test emails."
        );
      }

      await sendEmailSmokeTest(payload.recipientEmail, payload.template);
    }

    return apiSuccess(
      {
        preview,
        template: payload.template,
        mode: payload.mode,
      },
      {
        message:
          payload.mode === "send" ? "Smoke-test email sent." : "Smoke-test preview generated.",
      }
    );
  } catch (error) {
    return apiError(error);
  }
}
