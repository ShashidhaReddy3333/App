import { z } from "zod";

const demoModeSchema = z.enum(["true", "false"]).default("false");
const databaseUrlSchema = z.string().min(1, "DATABASE_URL is required.");
const sessionSecretSchema = z.string().min(16, "SESSION_SECRET must be at least 16 characters.");
const appUrlSchema = z.string().url("APP_URL must be a valid absolute URL.");
const resendApiKeySchema = z.string().min(1, "RESEND_API_KEY is required when email delivery is enabled.");
const mailFromSchema = z.string().min(1, "MAIL_FROM is required when email delivery is enabled.");
const mailReplyToSchema = z.string().min(1).optional();
const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

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

export function isProductionRuntime() {
  return getNodeEnv() === "production";
}

export function getDemoMode() {
  return demoModeSchema.parse(process.env.DEMO_MODE ?? "false");
}

export function requiresEmailDelivery() {
  return getDemoMode() !== "true";
}

export function getRuntimeCheckIssues() {
  const issues: RuntimeCheckIssue[] = [];
  const nodeEnv = getNodeEnv();
  const appUrl = resolveAppUrlValue();
  const parsedAppUrl = appUrlSchema.safeParse(appUrl);
  const parsedDatabaseUrl = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  const parsedSessionSecret = sessionSecretSchema.safeParse(process.env.SESSION_SECRET);

  if (!parsedDatabaseUrl.success) {
    issues.push({ key: "DATABASE_URL", message: parsedDatabaseUrl.error.issues[0]?.message ?? "DATABASE_URL is required.", severity: "error" });
  }

  if (!parsedSessionSecret.success) {
    issues.push({
      key: "SESSION_SECRET",
      message: parsedSessionSecret.error.issues[0]?.message ?? "SESSION_SECRET must be at least 16 characters.",
      severity: "error"
    });
  } else if (parsedSessionSecret.data.length < 32) {
    issues.push({
      key: "SESSION_SECRET",
      message: "SESSION_SECRET should be at least 32 characters for production deployments.",
      severity: nodeEnv === "production" ? "warning" : "warning"
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
  get SESSION_SECRET() {
    return sessionSecretSchema.parse(process.env.SESSION_SECRET);
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
  }
} as const;
