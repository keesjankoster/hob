import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../../utils/logger.js";
import { ensureCommand, runCommand } from "../../utils/runner.js";

export interface ScratchOpenOptions {
  path?: string;
  browser?: "chrome" | "edge" | "firefox";
  urlOnly?: boolean;
  private?: boolean;
}

export async function handleScratchOpen(
  rawAlias: string | undefined,
  options: ScratchOpenOptions
): Promise<void> {
  await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

  const targetDesc = rawAlias || "default org";

  console.log();
  logger.elf(
    `Hob is opening the castle gates for '${pc.bold(pc.cyan(targetDesc))}'...`
  );
  console.log();

  const sfArgs = ["org", "open"];

  if (rawAlias) {
    sfArgs.push("--target-org", rawAlias);
  }

  if (options.path) {
    sfArgs.push("--path", options.path);
  }

  if (options.browser) {
    sfArgs.push("--browser", options.browser);
  }

  if (options.private) {
    sfArgs.push("--private");
  }

  if (options.urlOnly) {
    sfArgs.push("--url-only", "--json");
  }

  const spinner = ora({
    text: options.urlOnly
      ? "Hob is generating your enchanted login portal URL..."
      : "Hob is launching your browser into the org...",
    color: "magenta"
  }).start();

  try {
    const { stdout } = await runCommand("sf", sfArgs);
    spinner.stop();

    if (options.urlOnly) {
      try {
        const data = JSON.parse(stdout);
        const url = data.result?.url || stdout.trim();
        logger.success("Portal URL generated:");
        console.log();
        console.log(`  ${pc.bold("Login URL:")} ${pc.cyan(url)}`);
        console.log();
      } catch {
        console.log(stdout);
      }
    } else {
      logger.success(`Org '${pc.bold(targetDesc)}' opened in browser.`);
      console.log();
    }

    logger.elf("Enjoy your stay in the org! 🧦");
    console.log();
  } catch (err: any) {
    spinner.fail(pc.red(`Failed to open org: ${err.message}`));
    console.log();
    process.exit(1);
  }
}

export function registerScratchOpenCommand(scratchCmd: Command): void {
  scratchCmd
    .command("open [alias]")
    .description("Open a scratch org (or default org) in your browser")
    .option("-p, --path <path>", "Navigation URL path to open a specific page (e.g. lightning/o/Account/list)")
    .option("-b, --browser <browser>", "Browser where the org opens (chrome, edge, firefox)")
    .option("-r, --url-only", "Display navigation URL without launching the browser", false)
    .option("--private", "Open the org in an incognito/private browser window", false)
    .action(async (alias: string | undefined, options: ScratchOpenOptions) => {
      logger.banner();
      await handleScratchOpen(alias, options);
    });
}
