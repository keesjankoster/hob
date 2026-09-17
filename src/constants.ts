import fs from "node:fs";
import path from "node:path";

// Attempt to load .env file from current working directory if available
const envPath = path.resolve(process.cwd(), ".env");
try {
  if (typeof process.loadEnvFile === "function" && fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} catch {
  // Ignore errors reading or parsing .env file
}

export const DEFAULT_API_VERSION = process.env.HOB_API_VERSION || "63.0";
export const DEFAULT_PACKAGE_DIR = process.env.HOB_PACKAGE_DIR || "force-app";
export const DEFAULT_DEVHUB_ALIAS = process.env.HOB_DEVHUB_ALIAS || "devhub";
