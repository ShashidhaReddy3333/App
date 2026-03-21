import { z } from "zod";

const demoModeSchema = z.enum(["true", "false"]).default("false");
const databaseUrlSchema = z.string().min(1, "DATABASE_URL is required.");
const directUrlSchema = z.string().url("DIRECT_URL must be a valid absolute URL.");
const sessionSecretSchema = z.string().min(16, "SESSION_SECRET must be at least 16 characters.");
const productionSessionSecretSchema = z.string().min(32, "SESSION_SECRET must be at least 32 characters in production.");
const appUrlSchema = z.string().url("APP_URL must be a valid absolute URL.");
const resendApiKeySchema = z.string().min(1, "RESEND_API_KEY is required when email delivery is enabled.");
const mailFromSchema = z.string().min(1, "MAIL_FROM is required when email delivery is enabled.");
const mailReplyToSchema = z.string().min(1).optional();
const sentryDsnSchema = z.string().url("SENTRY_DSN must be a valid absolute URL.");
const cronSecretSchema = z.string().min(16, "CRON_SECRET must be at least 16 characters.");
const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");
const stripeSecretKeySchema = z.string().min(1, "STRIPE_SECRET_KEY is required.");
const stripeWebhookSecretSchema = z.string().min(1, "STRIPE_WEBHOOK_SECRET is required.");
const upstashRedisUrlSchema = z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL.");
const upstashRedisTokenSchema = z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required.");
const blobReadWriteTokenSchema = z.string().min(1, "BLOB_READ_WRITE_TOKEN is required.");
const platformAdminEmailSchema = z.string().email("PLATFORM_ADMIN_EMAIL must be a valid email.");

export type RuntimeCheckIssue = {
  key: string;
  message: string;
  severity: "error" | "warning";
};

function resolveAppUrlValue() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function parseOptional<T>(schema: z.ZodType<T>, value: string | undefined) {
  if (!value) {
    return null;
  }

  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

export function getNodeEnv() {
  return nodeEnvSchema.parse(process.env.NODE_ENV ?? "development");
}

function getSessionSecretSchema() {
  return getNodeEnv() === "production" ? productionSessionSecretSchema : sessionSecretSchema;
}

function parseSessionSecret(value: string | undefined) {
  return getSessionSecretSchema().safeParse(value);
}

export function isProductionRuntime() {
  return getNodeEnv() === "production";
}

export function getDemoMode() {
  return demoModeSchema.parse(process.env.DEMO_MODE ?? "false");
}

export function requiresEmailDelivery() {
  return getDemoMode() !== "true";
}

export function requiresProductionMonitoring() {
  return getNodeEnv() === "production";
}

export function getOptionalSentryDsn() {
  return parseOptional(sentryDsnSchema, process.env.SENTRY_DSN);
}

export function getOptionalCronSecret() {
  return parseOptional(cronSecretSchema, process.env.CRON_SECRET);
}

export function getOptionalStripeSecretKey() {
  return parseOptional(stripeSecretKeySchema, process.env.STRIPE_SECRET_KEY);
}

export function getOptionalStripeWebhookSecret() {
  return parseOptional(stripeWebhookSecretSchema, process.env.STRIPE_WEBHOOK_SECRET);
}

export function getOptionalUpstashRedisUrl() {
  return parseOptional(upstashRedisUrlSchema, process.env.UPSTASH_REDIS_REST_URL);
}

export function getOptionalBlobToken() {
  return parseOptional(blobReadWriteTokenSchema, process.env.BLOB_READ_WRITE_TOKEN);
}

export function getOptionalPlatformAdminEmail() {
  return parseOptional(platformAdminEmailSchema, process.env.PLATFORM_ADMIN_EMAIL);
}

export function getRuntimeCheckIssues() {
  const issues: RuntimeCheckIssue[] = [];
  const nodeEnv = getNodeEnv();
  const appUrl = resolveAppUrlValue();
  const parsedAppUrl = appUrlSchema.safeParse(appUrl);
  const parsedDatabaseUrl = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  const parsedDirectUrl = directUrlSchema.safeParse(process.env.DIRECT_URL);
  const parsedSessionSecret = parseSessionSecret(process.env.SESSION_SECRET);

  if (!parsedDatabaseUrl.success) {
    issues.push({ key: "DATABASE_URL", message: parsedDatabaseUrl.error.issues[0]?.message ?? "DATABASE_URL is required.", severity: "error" });
  }

  if (!parsedDirectUrl.success) {
    issues.push({ key: "DIRECT_URL", message: parsedDirectUrl.error.issues[0]?.message ?? "DIRECT_URL must be a valid absolute URL.", severity: "error" });
  }

  if (!parsedSessionSecret.success) {
    issues.push({
      key: "SESSION_SECRET",
      message: parsedSessionSecret.error.issues[0]?.message ?? "SESSION_SECRET must meet the minimum length requirement.",
      severity: "error"
    });
  } else if (nodeEnv !== "production" && parsedSessionSecret.data.length < 32) {
    issues.push({
      key: "SESSION_SECRET",
      message: "SESSION_SECRET should be at least 32 characters for production deployments.",
      severity: "warning"
    });
  }

  if (!parsedAppUrl.success) {
    issues.push({ key: "APP_URL", message: parsedAppUrl.error.issues[0]?.message ?? "APP_URL must be a valid absolute URL.", severity: "error" });
  } else if (nodeEnv === "production" && !parsedAppUrl.data.startsWith("https://")) {
    issues.push({
      key: "APP_URL",
      message: "APP_URL should use https:// in production.",
      severity: "warning"
    });
  }

  if (requiresEmailDelivery()) {
    if (!parseOptional(resendApiKeySchema, process.env.RESEND_API_KEY)) {
      issues.push({
        key: "RESEND_API_KEY",
        message: "RESEND_API_KEY is required when DEMO_MODE=false.",
        severity: "error"
      });
    }
    if (!parseOptional(mailFromSchema, process.env.MAIL_FROM)) {
      issues.push({
        key: "MAIL_FROM",
        message: "MAIL_FROM is required when DEMO_MODE=false.",
        severity: "error"
      });
    }
  }

  if (requiresProductionMonitoring()) {
    if (!getOptionalSentryDsn()) {
      issues.push({
        key: "SENTRY_DSN",
        message: "SENTRY_DSN is required in production so runtime failures are captured.",
        severity: "warning"
      });
    }

    if (!getOptionalCronSecret()) {
      issues.push({
        key: "CRON_SECRET",
        message: "CRON_SECRET is required in production to protect internal job routes.",
        severity: "error"
      });
    }

    if (!getOptionalStripeSecretKey()) {
      issues.push({
        key: "STRIPE_SECRET_KEY",
        message: "STRIPE_SECRET_KEY is required for payment processing.",
        severity: "warning"
      });
    }

    if (!getOptionalStripeWebhookSecret()) {
      issues.push({
        key: "STRIPE_WEBHOOK_SECRET",
        message: "STRIPE_WEBHOOK_SECRET is required to verify Stripe webhooks.",
        severity: "warning"
      });
    }
  }

  if (nodeEnv === "production" && getDemoMode() === "true") {
    issues.push({
      key: "DEMO_MODE",
      message: "DEMO_MODE should be false in production.",
      severity: "warning"
    });
  }

  return issues;
}

export function validateRuntimeEnvironment(options?: { allowWarnings?: boolean }) {
  const issues = getRuntimeCheckIssues();
  const blocking = issues.filter((issue) => issue.severity === "error" || (!options?.allowWarnings && issue.severity === "warning"));

  if (blocking.length > 0) {
    throw new Error(blocking.map((issue) => `${issue.key}: ${issue.message}`).join("\n"));
  }

  return issues;
}

export const env = {
  get NODE_ENV() {
    return getNodeEnv();
  },
  get DATABASE_URL() {
    return databaseUrlSchema.parse(process.env.DATABASE_URL);
  },
  get DIRECT_URL() {
    return directUrlSchema.parse(process.env.DIRECT_URL);
  },
  get SESSION_SECRET() {
    return getSessionSecretSchema().parse(process.env.SESSION_SECRET);
  },
  get APP_URL() {
    return appUrlSchema.parse(resolveAppUrlValue());
  },
  get DEMO_MODE() {
    return getDemoMode();
  },
  get RESEND_API_KEY() {
    return resendApiKeySchema.parse(process.env.RESEND_API_KEY);
  },
  get MAIL_FROM() {
    return mailFromSchema.parse(process.env.MAIL_FROM);
  },
  get MAIL_REPLY_TO() {
    return mailReplyToSchema.parse(process.env.MAIL_REPLY_TO);
  },
  get SENTRY_DSN() {
    return sentryDsnSchema.parse(process.env.SENTRY_DSN);
  },
  get CRON_SECRET() {
    return cronSecretSchema.parse(process.env.CRON_SECRET);
  }
} as const;
