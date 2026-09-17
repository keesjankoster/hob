import path from "node:path";
import fs from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
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
  noPrompt?: boolean;
  force?: boolean;
}

export interface OrgInspectionResult {
  username: string;
  alias?: string;
  isScratch: boolean;
  orgEdition?: string;
  isSandbox?: boolean;
  isDevHub?: boolean;
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

/**
 * Inspects target org to determine whether it is a scratch org or persistent environment
 */
export async function inspectTargetOrg(targetOrgInput?: string): Promise<OrgInspectionResult | null> {
  try {
    const { stdout } = await runCommand("sf", ["org", "list", "--json"]);
    const data = JSON.parse(stdout);
    const result = data.result || {};

    const scratchOrgs: any[] = result.scratchOrgs || [];
    const nonScratchOrgs: any[] = result.nonScratchOrgs || [];
    const devHubs: any[] = result.devHubs || [];
    const sandboxes: any[] = result.sandboxes || [];
    const other: any[] = result.other || [];

    const allOrgs = [
      ...scratchOrgs.map((o) => ({ ...o, isScratch: true })),
      ...nonScratchOrgs,
      ...devHubs,
      ...sandboxes,
      ...other
    ];

    let matched: any = undefined;

    if (targetOrgInput) {
      const lower = targetOrgInput.toLowerCase();
      matched = allOrgs.find(
        (o) => o.alias?.toLowerCase() === lower || o.username?.toLowerCase() === lower
      );
    } else {
      matched = allOrgs.find((o) => o.isDefaultUsername === true);
    }

    if (matched) {
      return {
        username: matched.username,
        alias: matched.alias,
        isScratch: Boolean(matched.isScratch),
        orgEdition: matched.orgEdition,
        isSandbox: Boolean(matched.isSandbox),
        isDevHub: Boolean(matched.isDevHub)
      };
    }

    // Fallback: If targetOrgInput was explicitly given but not matched in local list
    if (targetOrgInput) {
      try {
        const { stdout: dispStdout } = await runCommand("sf", [
          "org",
          "display",
          "--target-org",
          targetOrgInput,
          "--json"
        ]);
        const dispData = JSON.parse(dispStdout);
        if (dispData.result) {
          const res = dispData.result;
          return {
            username: res.username,
            alias: res.alias,
            isScratch: Boolean(res.isScratch || res.edition?.toLowerCase() === "scratch"),
            orgEdition: res.edition || res.orgEdition,
            isSandbox: Boolean(res.isSandbox),
            isDevHub: Boolean(res.isDevHub)
          };
        }
      } catch {
        // Leave null
      }
    }

    return null;
  } catch {
    return null;
  }
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

  // Pre-validate seed file existence if targetFile is specified
  let resolvedTargetFile: string | null = null;
  if (targetFile) {
    resolvedTargetFile = path.isAbsolute(targetFile)
      ? targetFile
      : path.resolve(projectRoot, targetFile);

    if (!fs.existsSync(resolvedTargetFile)) {
      logger.error(`Seed file not found: ${resolvedTargetFile}`);
      console.log();
      process.exit(1);
    }
  }

  // Verify target org and protect persistent non-scratch environments
  const inspectSpinner = ora({
    text: "Hob is verifying target org environment...",
    color: "magenta"
  }).start();

  const orgInfo = await inspectTargetOrg(options.targetOrg);
  inspectSpinner.stop();

  if (!options.targetOrg && (!orgInfo || !orgInfo.username)) {
    logger.error(
      "No default org found in Salesforce CLI. Please specify --target-org <org> or set a default org."
    );
    console.log();
    process.exit(1);
  }

  // Safety check: Prompt if target org is NOT a scratch org
  if (orgInfo && !orgInfo.isScratch) {
    const orgDisplayName = orgInfo.alias
      ? `${orgInfo.alias} (${orgInfo.username})`
      : orgInfo.username;
    const editionType =
      orgInfo.orgEdition || (orgInfo.isSandbox ? "Sandbox" : "Non-Scratch Org");
    const seedTargetDesc =
      targetFile ||
      (Array.isArray(options.files) ? options.files.join(", ") : options.files) ||
      "seed data";

    console.log();
    console.log(
      pc.bold(pc.bgYellow(pc.black("  ⚠  WARNING: TARGET ORG IS NOT A SCRATCH ORG!  ")))
    );
    console.log();
    console.log(`  ${pc.bold("Target Org:")}   ${pc.yellow(orgDisplayName)}`);
    console.log(
      `  ${pc.bold("Environment:")}  ${pc.red(editionType)} ${orgInfo.isDevHub ? pc.dim("(Dev Hub)") : ""}`
    );
    console.log(`  ${pc.bold("Payload:")}      ${pc.cyan(seedTargetDesc)}`);
    console.log();
    console.log(
      pc.yellow(
        "  Seeding test data into a persistent Sandbox, Developer Edition, or Production org\n  may overwrite existing records, consume storage limits, or trigger business workflows."
      )
    );
    console.log();

    const skipPrompt = options.noPrompt || options.force;
    if (!skipPrompt) {
      const rl = readline.createInterface({ input, output });
      const answer = await rl.question(
        pc.bold(
          pc.yellow(
            "  Are you sure you want to seed data into this non-scratch org? [y/N]: "
          )
        )
      );
      rl.close();

      const confirmed =
        answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
      if (!confirmed) {
        console.log();
        logger.info("Data seeding cancelled. No changes were made to the org.");
        console.log();
        return;
      }
      console.log();
    }
  }

  const targetOrgDisplay = orgInfo?.alias
    ? `${orgInfo.alias} (${orgInfo.username})`
    : options.targetOrg || orgInfo?.username || "default org";

  console.log();
  logger.elf(`Hob is sowing test data into '${pc.bold(pc.cyan(targetOrgDisplay))}'...`);
  console.log();

  const spinner = ora({
    text: `Hob is executing test data seeding in Salesforce...`,
    color: "magenta"
  }).start();

  try {
    if (options.files) {
      const raw = Array.isArray(options.files) ? options.files : [options.files];
      const filePaths = raw
        .flatMap((f) => f.split(/[,\s]+/))
        .map((f) => f.trim())
        .filter(Boolean);
      const sfArgs = ["data", "import", "tree", "--files", filePaths.join(",")];
      if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

      await runCommand("sf", sfArgs);
      spinner.succeed(pc.green(`Imported records from ${filePaths.length} data file(s).`));
    } else if (targetFile && resolvedTargetFile) {
      if (targetFile.endsWith(".apex")) {
        const sfArgs = ["apex", "run", "--file", resolvedTargetFile];
        if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

        await runCommand("sf", sfArgs);
        spinner.succeed(
          pc.green(`Apex seed script '${pc.bold(targetFile)}' executed successfully.`)
        );
      } else if (targetFile.endsWith(".json")) {
        let isPlan = targetFile.endsWith("-plan.json") || targetFile.includes("plan");
        try {
          const content = JSON.parse(fs.readFileSync(resolvedTargetFile, "utf-8"));
          if (Array.isArray(content) || (content && Array.isArray(content.items))) {
            isPlan = true;
          }
        } catch {
          // Keep guess
        }

        const sfArgs = ["data", "import", "tree"];
        if (isPlan) {
          sfArgs.push("--plan", resolvedTargetFile);
        } else {
          sfArgs.push("--files", resolvedTargetFile);
        }
        if (options.targetOrg) sfArgs.push("--target-org", options.targetOrg);

        await runCommand("sf", sfArgs);
        spinner.succeed(
          pc.green(
            `Data tree ${isPlan ? "plan" : "file"} '${pc.bold(targetFile)}' imported successfully.`
          )
        );
      } else {
        // Fallback to apex run
        const sfArgs = ["apex", "run", "--file", resolvedTargetFile];
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
