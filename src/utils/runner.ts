import { execa } from "execa";
import { logger } from "./logger.js";

export interface RunOptions {
  cwd?: string;
  stdio?: "pipe" | "inherit" | "ignore";
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    const isWindows = process.platform === "win32";
    const checkCmd = isWindows ? "where" : "which";
    await execa(checkCmd, [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function ensureCommand(
  command: string,
  installHint?: string
): Promise<void> {
  const exists = await commandExists(command);
  if (!exists) {
    logger.error(`Required tool '${command}' was not found in your PATH.`);
    if (installHint) {
      logger.info(installHint);
    }
    process.exit(1);
  }
}

export async function runCommand(
  cmd: string,
  args: string[],
  options: RunOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execa(cmd, args, {
      cwd: options.cwd,
      stdio: options.stdio ?? "pipe"
    });
    return {
      stdout: result.stdout?.toString() ?? "",
      stderr: result.stderr?.toString() ?? ""
    };
  } catch (error: any) {
    const message = error.stderr || error.stdout || error.message;
    throw new Error(`Failed to execute '${cmd} ${args.join(" ")}': ${message}`);
  }
}
