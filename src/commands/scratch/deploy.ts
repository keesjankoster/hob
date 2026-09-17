import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { ensureCommand, runCommand } from "../../utils/runner.js";

export interface ScratchDeployOptions {
  sourceDir?: string | string[];
  metadata?: string | string[];
  manifest?: string;
  ignoreConflicts?: boolean;
  dryRun?: boolean;
  testLevel?: "NoTestRun" | "RunSpecifiedTests" | "RunLocalTests" | "RunAllTestsInOrg";
  tests?: string | string[];
  concise?: boolean;
}

export async function handleScratchDeploy(
  rawAlias: string | undefined,
  options: ScratchDeployOptions
): Promise<void> {
  await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

  const targetDesc = rawAlias || "default org";

  console.log();
  logger.elf(
    `Hob is carrying source code into '${pc.bold(pc.cyan(targetDesc))}'...`
  );
  console.log();

  const sfArgs = ["project", "deploy", "start"];

  if (rawAlias) {
    sfArgs.push("--target-org", rawAlias);
  }

  if (options.sourceDir) {
    const raw = Array.isArray(options.sourceDir) ? options.sourceDir : [options.sourceDir];
    const dirs = raw.flatMap((d) => d.split(/[,\s]+/)).map((d) => d.trim()).filter(Boolean);
    sfArgs.push("--source-dir", ...dirs);
  }

  if (options.metadata) {
    const raw = Array.isArray(options.metadata) ? options.metadata : [options.metadata];
    const meta = raw.flatMap((m) => m.split(/[,\s]+/)).map((m) => m.trim()).filter(Boolean);
    sfArgs.push("--metadata", ...meta);
  }

  if (options.manifest) {
    sfArgs.push("--manifest", options.manifest);
  }

  if (options.ignoreConflicts) {
    sfArgs.push("--ignore-conflicts");
  }

  if (options.dryRun) {
    sfArgs.push("--dry-run");
  }

  if (options.testLevel) {
    sfArgs.push("--test-level", options.testLevel);
  }

  if (options.tests) {
    const raw = Array.isArray(options.tests) ? options.tests : [options.tests];
    const tests = raw.flatMap((t) => t.split(/[,\s]+/)).map((t) => t.trim()).filter(Boolean);
    sfArgs.push("--tests", ...tests);
  }

  if (options.concise) {
    sfArgs.push("--concise");
  }

  try {
    await runCommand("sf", sfArgs, { stdio: "inherit" });
    console.log();
    logger.success(
      options.dryRun
        ? `Dry-run deployment validation succeeded for '${pc.bold(targetDesc)}'!`
        : `Source code successfully deployed to '${pc.bold(targetDesc)}'!`
    );
    console.log();
    logger.elf("The hearth is warm and your code is deployed! 🧦");
    console.log();
  } catch (err: any) {
    console.log();
    logger.error(`Deployment failed: ${err.message}`);
    console.log();
    process.exit(1);
  }
}

export function registerScratchDeployCommand(scratchCmd: Command): void {
  scratchCmd
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
}
