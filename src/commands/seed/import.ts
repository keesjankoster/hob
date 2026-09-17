import path from "node:path";
import fs from "node:fs";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../../utils/logger.js";
import { ensureCommand, runCommand } from "../../utils/runner.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";

export interface SeedImportOptions {
  targetOrg?: string;
  plan?: string;
  files?: string | string[];
  apex?: string;
}

/**
 * Searches standard project locations for a test data seed script or JSON plan
 */
export function discoverSeedTarget(projectRoot: string): string | null {
  const candidates = [
    "data/data-plan.json",
    "data/plan.json",
    "scripts/apex/seed.apex",
    "scripts/apex/init.apex",
    "data/seed.apex"
  ];

  for (const candidate of candidates) {
    const full = path.join(projectRoot, candidate);
    if (fs.existsSync(full)) {
      return candidate;
    }
  }

  // Look for any *-plan.json in data/
  const dataDir = path.join(projectRoot, "data");
  if (fs.existsSync(dataDir)) {
    try {
      const files = fs.readdirSync(dataDir);
      const plan = files.find((f) => f.endsWith("-plan.json"));
      if (plan) return path.join("data", plan);
    } catch {
      // Ignore
    }
  }

  return null;
}

export async function handleSeedImport(
  rawFile: string | undefined,
  options: SeedImportOptions
): Promise<void> {
  await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

  const sfdxInfo = getSfdxProjectInfo();
  const projectRoot = sfdxInfo.projectRoot;

  let targetFile = rawFile || options.plan || options.apex;

  if (!targetFile && !options.files) {
    const discovered = discoverSeedTarget(projectRoot);
    if (discovered) {
      targetFile = discovered;
      logger.info(`Auto-discovered seed file: ${pc.cyan(discovered)}`);
    } else {
      logger.error("No seed file or plan specified and none auto-discovered.");
      console.log();
      logger.elf(`Scaffold a starter seed script with: ${pc.cyan("hob seed init")}`);
      console.log(`Or specify a file: ${pc.cyan("hob seed data/data-plan.json")}`);
      console.log();
      process.exit(1);
    }
  }

  const targetOrg = options.targetOrg || "default org";

  console.log();
  logger.elf(`Hob is sowing test data into '${pc.bold(pc.cyan(targetOrg))}'...`);
  console.log();

  const spinner = ora({
    text: `Hob is executing test data seeding in Salesforce...`,
    color: "magenta"
  }).start();

  try {
    if (options.files) {
      const raw = Array.isArray(options.files) ? options.files : [options.files];
      const filePaths = raw.flatMap((f) => f.split(/[,\s]+/)).map((f) => f.trim()).filter(Boolean);
      const sfArgs = ["data", "import", "tree", "--files", filePaths.join(",")];
      if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

      await runCommand("sf", sfArgs);
      spinner.succeed(pc.green(`Imported records from ${filePaths.length} data file(s).`));
    } else if (targetFile) {
      const resolved = path.isAbsolute(targetFile) ? targetFile : path.resolve(projectRoot, targetFile);

      if (!fs.existsSync(resolved)) {
        spinner.fail(`Seed file not found: ${resolved}`);
        process.exit(1);
      }

      if (targetFile.endsWith(".apex")) {
        const sfArgs = ["apex", "run", "--file", resolved];
        if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

        await runCommand("sf", sfArgs);
        spinner.succeed(pc.green(`Apex seed script '${pc.bold(targetFile)}' executed successfully.`));
      } else if (targetFile.endsWith(".json")) {
        // Check if it's a plan file or single tree file
        let isPlan = targetFile.endsWith("-plan.json") || targetFile.includes("plan");
        try {
          const content = JSON.parse(fs.readFileSync(resolved, "utf-8"));
          if (Array.isArray(content) || (content && Array.isArray(content.items))) {
            isPlan = true;
          }
        } catch {
          // Keep guess
        }

        const sfArgs = ["data", "import", "tree"];
        if (isPlan) {
          sfArgs.push("--plan", resolved);
        } else {
          sfArgs.push("--files", resolved);
        }
        if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

        await runCommand("sf", sfArgs);
        spinner.succeed(
          pc.green(`Data tree ${isPlan ? "plan" : "file"} '${pc.bold(targetFile)}' imported successfully.`)
        );
      } else {
        // Fallback to apex run
        const sfArgs = ["apex", "run", "--file", resolved];
        if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

        await runCommand("sf", sfArgs);
        spinner.succeed(pc.green(`Seed script '${pc.bold(targetFile)}' executed.`));
      }
    }

    console.log();
    logger.success("Test data seeding completed successfully!");
    console.log();
    logger.elf("The fields are sown and the org is brimming with fresh test data! 🧦");
    console.log();
  } catch (err: any) {
    spinner.fail(pc.red("Data seeding failed."));
    logger.error(err.message);
    console.log();
    process.exit(1);
  }
}
