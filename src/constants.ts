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

// Scratch org defaults
export const DEFAULT_SCRATCH_DURATION = process.env.HOB_SCRATCH_DURATION || "7";
export const DEFAULT_SCRATCH_DEF_PATH = process.env.HOB_SCRATCH_DEF_PATH || "config/project-scratch-def.json";
export const DEFAULT_SCRATCH_PERMSETS = process.env.HOB_SCRATCH_PERMSETS || "";
export const DEFAULT_SCRATCH_SEED_SCRIPT = process.env.HOB_SCRATCH_SEED_SCRIPT || "";

// Testing defaults
export const DEFAULT_TEST_WAIT = process.env.HOB_TEST_WAIT || "10";
export const DEFAULT_TEST_COVERAGE = process.env.HOB_TEST_COVERAGE !== "false";

// Data Seeding defaults
export const DEFAULT_SEED_DIR = process.env.HOB_SEED_DIR || "data";
