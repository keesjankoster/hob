import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../utils/logger.js";
import { commandExists, runCommand } from "../utils/runner.js";

export interface HearthOptions {
  alias?: string;
  instanceUrl?: string;
  browser?: "chrome" | "edge" | "firefox";
}

export function registerHearthCommand(program: Command): void {
  program
    .command("hearth [alias]")
    .description("Light the hearth: Log in to a Salesforce Dev Hub org and set it as default")
    .option("-a, --alias <alias>", "Alias for the Dev Hub org (default: devhub)")
    .option("-r, --instance-url <url>", "URL of the instance (default: https://login.salesforce.com)")
    .option("-b, --browser <browser>", "Browser to use (chrome, edge, firefox)")
    .action(async (positionalAlias: string | undefined, options: HearthOptions) => {
      logger.banner();

      const hasSf = await commandExists("sf");
      if (!hasSf) {
        logger.error("The Salesforce CLI ('sf') is not found in your PATH.");
        logger.info("Please install it via: npm install -g @salesforce/cli");
        process.exit(1);
      }

      const alias = options.alias || positionalAlias || "devhub";

      logger.elf(`Hob is tending the hearth: opening your browser to authorize Dev Hub '${pc.bold(alias)}'...`);
      console.log();

      const sfArgs = [
        "org",
        "login",
        "web",
        "--set-default-dev-hub",
        "--alias",
        alias
      ];

      if (options.instanceUrl) {
        sfArgs.push("--instance-url", options.instanceUrl);
      }

      if (options.browser) {
        sfArgs.push("--browser", options.browser);
      }

      try {
        await runCommand("sf", sfArgs, { stdio: "inherit" });
        console.log();
        logger.success(`The hearth is lit! Dev Hub '${pc.bold(alias)}' is authorized and set as default.`);
        console.log();
        logger.elf("You're ready to kindle scratch orgs with Hob:");
        console.log(`  ${pc.cyan(`sf org list`)} ${pc.dim("to see your authorized orgs")}`);
        console.log();
      } catch (err: any) {
        console.log();
        logger.error(`Failed to authorize Dev Hub: ${err.message}`);
        process.exit(1);
      }
    });
}
