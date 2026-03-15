import { z } from "zod";

const demoModeSchema = z.enum(["true", "false"]).default("false");
const databaseUrlSchema = z.string().min(1, "DATABASE_URL is required.");
const sessionSecretSchema = z.string().min(16, "SESSION_SECRET must be at least 16 characters.");
const appUrlSchema = z.string().url("APP_URL must be a valid absolute URL.");

function resolveAppUrlValue() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export const env = {
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
    return demoModeSchema.parse(process.env.DEMO_MODE ?? "false");
  }
} as const;
