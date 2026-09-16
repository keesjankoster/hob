import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../utils/logger.js";
import { commandExists, runCommand } from "../utils/runner.js";

export interface HearthOptions {
  list?: boolean;
  clean?: boolean;
  noPrompt?: boolean;
  alias?: string;
  instanceUrl?: string;
  browser?: "chrome" | "edge" | "firefox";
}

interface DevHubOrg {
  alias?: string;
  username: string;
  orgId: string;
  isDefaultDevHubUsername?: boolean;
  connectedStatus?: string;
}

async function handleListHearths(): Promise<void> {
  const spinner = ora({
    text: "Hob is checking the hearths...",
    color: "magenta"
  }).start();

  try {
    const { stdout } = await runCommand("sf", ["org", "list", "--json"]);
    spinner.stop();

    const data = JSON.parse(stdout);
    const devHubs: DevHubOrg[] = data.result?.devHubs ?? [];

    if (devHubs.length === 0) {
      logger.info("No hearths (Dev Hubs) found.");
      logger.elf("Light one with: " + pc.cyan("hob hearth [alias]"));
      console.log();
      return;
    }

    console.log();
    logger.elf("Hob found the following hearths (Dev Hubs):");
    console.log();

    // Table header
    const colAlias = "Alias".padEnd(16);
    const colDefault = "Default".padEnd(10);
    const colStatus = "Status".padEnd(14);
    const colOrgId = "Org Id".padEnd(20);
    const colUsername = "Username";

    console.log(pc.bold(pc.cyan(`  ${colAlias}${colDefault}${colStatus}${colOrgId}${colUsername}`)));
    console.log(pc.dim(`  ${"─".repeat(14)}  ${"─".repeat(8)}  ${"─".repeat(12)}  ${"─".repeat(18)}  ${"─".repeat(30)}`));

    for (const hub of devHubs) {
      const alias = (hub.alias || pc.dim("(none)")).padEnd(16);
      const isDefault = hub.isDefaultDevHubUsername
        ? pc.green("🔥 yes").padEnd(19) // picocolors adds invisible ANSI characters so pad appropriately
        : pc.dim("no").padEnd(10);
      const status = hub.connectedStatus === "Connected"
        ? pc.green("Connected").padEnd(23)
        : pc.yellow(hub.connectedStatus || "Unknown").padEnd(23);
      const orgId = hub.orgId.padEnd(20);
      const username = pc.white(hub.username);

      console.log(`  ${alias}${isDefault}${status}${orgId}${username}`);
    }

    console.log();
  } catch (err: any) {
    spinner.fail("Failed to retrieve org list.");
    logger.error(err.message);
    process.exit(1);
  }
}

async function handleCleanHearths(noPrompt: boolean = true): Promise<void> {
  const spinner = ora({
    text: "Hob is sweeping the hearth: clearing inactive and expired scratch orgs...",
    color: "magenta"
  }).start();

  try {
    const args = ["org", "list", "--clean"];
    if (noPrompt) {
      args.push("--no-prompt");
    }

    await runCommand("sf", args);
    spinner.succeed(pc.green("The hearth is swept clean! Removed inactive scratch org authorizations."));
    console.log();
    logger.elf("Hob kept the hearth tidy and free of dead ashes 🧦");
    console.log();
  } catch (err: any) {
    spinner.fail("Failed to clean the hearth.");
    logger.error(err.message);
    process.exit(1);
  }
}

export function registerHearthCommand(program: Command): void {
  program
    .command("hearth [alias]")
    .description("Light, list, or sweep the hearth (Dev Hub management)")
    .option("-l, --list", "List all authorized Dev Hub hearths")
    .option("-c, --clean", "Sweep the hearth: remove inactive/expired scratch org authorizations")
    .option("-p, --no-prompt", "Do not prompt for confirmation when sweeping the hearth", true)
    .option("-a, --alias <alias>", "Alias for the Dev Hub org when lighting (default: devhub)")
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

      // Check if user requested listing
      if (options.list || positionalAlias === "list") {
        await handleListHearths();
        return;
      }

      // Check if user requested cleaning
      if (options.clean || positionalAlias === "clean") {
        await handleCleanHearths(options.noPrompt !== false);
        return;
      }

      // Otherwise: Light the hearth (authorize Dev Hub)
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
        console.log(`  ${pc.cyan(`hob hearth --list`)} ${pc.dim("to inspect your hearths")}`);
        console.log();
      } catch (err: any) {
        console.log();
        logger.error(`Failed to authorize Dev Hub: ${err.message}`);
        process.exit(1);
      }
    });
}
