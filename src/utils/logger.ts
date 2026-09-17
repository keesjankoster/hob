import pc from "picocolors";

export const logger = {
  banner(): void {
    console.log();
    console.log(pc.bold(pc.magenta("  🧙 Hob ")) + pc.dim("— The Salesforce House-Elf 🧦"));
    console.log(pc.dim("  \"Loyal, quiet, and tireless assistance for your Salesforce Development.\""));
    console.log();
  },

  info(message: string): void {
    console.log(pc.blue("ℹ ") + message);
  },

  step(step: number, total: number, message: string): void {
    console.log(pc.dim(`[${step}/${total}] `) + pc.cyan(message));
  },

  success(message: string): void {
    console.log(pc.green("✔ ") + pc.bold(message));
  },

  warn(message: string): void {
    console.log(pc.yellow("⚠ ") + message);
  },

  error(message: string): void {
    console.error(pc.red("✖ ") + pc.bold(message));
  },

  elf(message: string): void {
    console.log(pc.magenta("🧦 ") + pc.italic(message));
  }
};
