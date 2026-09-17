import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import { registerCreateCommand } from "./commands/create/index.js";
import { registerHearthCommand } from "./commands/hearth.js";
import { registerScratchCommand } from "./commands/scratch/index.js";
import { registerTestCommand } from "./commands/test.js";
import { registerSeedCommand } from "./commands/seed/index.js";
import { handleScratchOpen, ScratchOpenOptions } from "./commands/scratch/open.js";
import { handleScratchDeploy, ScratchDeployOptions } from "./commands/scratch/deploy.js";
import { logger } from "./utils/logger.js";

// Read version safely from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let version = "0.1.0";
try {
  const pkgPath = path.resolve(__dirname, "../package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    version = pkg.version || version;
  }
} catch {
  // Fallback version
}

const program = new Command();

program
  .name("hob")
  .description("🧙 Hob: The Salesforce House-Elf 🧦\nQuiet, loyal assistance for your Salesforce & Git workflows")
  .version(version, "-v, --version", "Output the current version of Hob");

// Register commands
registerCreateCommand(program);
registerHearthCommand(program);
registerScratchCommand(program);
registerTestCommand(program);
registerSeedCommand(program);

// Top-level shortcuts for frequent developer workflows
program
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

program
  .command("deploy [alias]")
  .aliases(["push"])
  .description("Deploy local source code and metadata changes into a scratch org")
  .option("-d, --source-dir <dirs...>", "Path to local source files or directories to deploy")
  .option("-m, --metadata <metadata...>", "Specific metadata components to deploy (e.g. ApexClass:MyClass)")
  .option("-x, --manifest <file>", "Full file path for manifest (package.xml) of components to deploy")
  .option("-c, --ignore-conflicts", "Ignore conflicts and force deploy local changes", false)
  .option("--dry-run", "Validate deployment against the org without persisting changes", false)
  .option(
    "-l, --test-level <level>",
    "Deployment Apex testing level (NoTestRun, RunSpecifiedTests, RunLocalTests, RunAllTestsInOrg)"
  )
  .option("-t, --tests <tests...>", "Apex tests to run when --test-level is RunSpecifiedTests")
  .option("--concise", "Display concise deployment output", false)
  .action(async (alias: string | undefined, options: ScratchDeployOptions) => {
    logger.banner();
    await handleScratchDeploy(alias, options);
  });

// Handle unknown commands gracefully
program.on("command:*", (operands) => {
  console.error(`\n✖ Unknown command: ${operands.join(" ")}`);
  console.error("Run 'hob --help' for a list of available commands.\n");
  process.exit(1);
});

export async function run(): Promise<void> {
  await program.parseAsync(process.argv);
}

run().catch((err) => {
  console.error("\n✖ Unexpected error:", err);
  process.exit(1);
});
