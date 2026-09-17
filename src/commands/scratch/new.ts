import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../../utils/logger.js";
import { ensureCommand, runCommand } from "../../utils/runner.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import {
  DEFAULT_SCRATCH_DURATION,
  DEFAULT_SCRATCH_DEF_PATH,
  DEFAULT_SCRATCH_PERMSETS,
  DEFAULT_SCRATCH_SEED_SCRIPT
} from "../../constants.js";

export interface ScratchNewOptions {
  duration?: string;
  definitionFile?: string;
  targetDevHub?: string;
  permissionSets?: string | string[];
  seedScript?: string;
  open?: boolean;
  setDefault?: boolean;
  browser?: "chrome" | "edge" | "firefox";
}

/**
 * Auto-discovers permission sets from the project's permissionsets directory
 */
function discoverPermissionSets(projectRoot: string, defaultPackageDir: string): string[] {
  const permSetDir = path.join(projectRoot, defaultPackageDir, "main", "default", "permissionsets");
  if (!fs.existsSync(permSetDir)) {
    return [];
  }

  try {
    return fs
      .readdirSync(permSetDir)
      .filter((file) => file.endsWith(".permissionset-meta.xml"))
      .map((file) => file.replace(/\.permissionset-meta\.xml$/, ""));
  } catch {
    return [];
  }
}

/**
 * Auto-discovers standard seed script or data plan paths
 */
function discoverSeedScript(projectRoot: string): string | null {
  const candidates = [
    "scripts/apex/seed.apex",
    "scripts/apex/init.apex",
    "data/seed.apex",
    "data/data-plan.json"
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(projectRoot, candidate);
    if (fs.existsSync(fullPath)) {
      return candidate;
    }
  }

  return null;
}

export function registerScratchNewCommand(scratchCmd: Command): void {
  scratchCmd
    .command("new [alias]")
    .description(
      "Provision and fully set up a scratch org (create, deploy source, assign permissions, seed data, open browser)"
    )
    .option("-d, --duration <days>", "Lifetime of scratch org in days", DEFAULT_SCRATCH_DURATION)
    .option(
      "-f, --definition-file <file>",
      "Scratch org definition file",
      DEFAULT_SCRATCH_DEF_PATH
    )
    .option("-v, --target-dev-hub <devhub>", "Target Dev Hub org alias or username")
    .option(
      "-p, --permission-sets <permsets...>",
      "Permission set name(s) to assign (space or comma separated)"
    )
    .option("-s, --seed-script <path>", "Path to test data seed script (.apex or .json plan)")
    .option("--no-open", "Do not open the scratch org in a browser")
    .option("--no-set-default", "Do not set the created scratch org as default")
    .option("-b, --browser <browser>", "Browser to open (chrome, edge, firefox)")
    .action(async (positionalAlias: string | undefined, options: ScratchNewOptions) => {
      logger.banner();

      await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

      const alias = positionalAlias || "scratch-org";
      const duration = options.duration || DEFAULT_SCRATCH_DURATION;
      const defFile = options.definitionFile || DEFAULT_SCRATCH_DEF_PATH;
      const projectInfo = getSfdxProjectInfo();
      const projectRoot = projectInfo.projectRoot;

      console.log();
      logger.elf(
        `Hob is preparing to kindle scratch org '${pc.bold(pc.cyan(alias))}' with a full pipeline...`
      );
      console.log();

      // Check definition file
      const resolvedDefFile = path.isAbsolute(defFile)
        ? defFile
        : path.resolve(projectRoot, defFile);

      if (!fs.existsSync(resolvedDefFile)) {
        logger.warn(
          `Scratch org definition file '${defFile}' was not found at ${resolvedDefFile}.`
        );
        logger.info(
          "Ensure your project contains a scratch definition file (e.g. config/project-scratch-def.json)."
        );
      }

      // ==========================================
      // Step 1: Provision the scratch org
      // ==========================================
      logger.step(1, 5, `Kindling scratch org '${alias}' (duration: ${duration} days)...`);
      const provisionSpinner = ora({
        text: `Hob is requesting scratch org '${alias}' from the Dev Hub...`,
        color: "magenta"
      }).start();

      const createArgs = [
        "org",
        "create",
        "scratch",
        "--duration-days",
        duration,
        "--alias",
        alias,
        "--json"
      ];

      if (fs.existsSync(resolvedDefFile)) {
        createArgs.push("--definition-file", resolvedDefFile);
      }

      if (options.targetDevHub) {
        createArgs.push("--target-dev-hub", options.targetDevHub);
      }

      if (options.setDefault !== false) {
        createArgs.push("--set-default");
      }

      let scratchUsername = "";
      let scratchOrgId = "";

      try {
        const { stdout } = await runCommand("sf", createArgs);
        const data = JSON.parse(stdout);
        scratchUsername = data.result?.username || "";
        scratchOrgId = data.result?.orgId || "";

        provisionSpinner.succeed(
          pc.green(
            `Scratch org '${pc.bold(alias)}' provisioned successfully! ` +
              pc.dim(`(Org ID: ${scratchOrgId || "unknown"})`)
          )
        );
      } catch (err: any) {
        provisionSpinner.fail(pc.red(`Failed to provision scratch org '${alias}'.`));
        logger.error(err.message);
        process.exit(1);
      }

      // ==========================================
      // Step 2: Deploy / push source code
      // ==========================================
      console.log();
      logger.step(2, 5, "Carrying source code into the scratch org...");
      const deploySpinner = ora({
        text: "Hob is deploying local source files into the scratch org...",
        color: "magenta"
      }).start();

      try {
        await runCommand("sf", ["project", "deploy", "start", "--target-org", alias]);
        deploySpinner.succeed(pc.green("Source code deployed successfully to scratch org."));
      } catch (err: any) {
        deploySpinner.warn(
          pc.yellow(`Source deployment completed with warning or error: ${err.message}`)
        );
        logger.info("Continuing with remaining setup pipeline...");
      }

      // ==========================================
      // Step 3: Assign default permission sets
      // ==========================================
      console.log();
      logger.step(3, 5, "Granting permissions in the scratch org...");

      // Resolve permission sets: options -> env -> auto-discovery
      let permSetsToAssign: string[] = [];

      if (options.permissionSets) {
        const raw = Array.isArray(options.permissionSets)
          ? options.permissionSets
          : [options.permissionSets];
        permSetsToAssign = raw
          .flatMap((p) => p.split(/[,\s]+/))
          .map((p) => p.trim())
          .filter(Boolean);
      } else if (DEFAULT_SCRATCH_PERMSETS) {
        permSetsToAssign = DEFAULT_SCRATCH_PERMSETS.split(/[,\s]+/)
          .map((p) => p.trim())
          .filter(Boolean);
      } else if (projectInfo.isSfdxProject) {
        permSetsToAssign = discoverPermissionSets(projectRoot, projectInfo.defaultPackageDir);
      }

      if (permSetsToAssign.length === 0) {
        logger.info(
          "No permission sets configured or found in default package directory. Skipped."
        );
      } else {
        for (const permSet of permSetsToAssign) {
          const permSpinner = ora({
            text: `Hob is assigning permission set '${permSet}'...`,
            color: "magenta"
          }).start();

          try {
            await runCommand("sf", [
              "org",
              "assign",
              "permset",
              "--name",
              permSet,
              "--target-org",
              alias
            ]);
            permSpinner.succeed(pc.green(`Assigned permission set '${pc.bold(permSet)}'.`));
          } catch (err: any) {
            permSpinner.warn(
              pc.yellow(`Could not assign permission set '${permSet}': ${err.message}`)
            );
          }
        }
      }

      // ==========================================
      // Step 4: Run test data seed script
      // ==========================================
      console.log();
      logger.step(4, 5, "Sowing test data seeds into the scratch org...");

      let seedScript = options.seedScript || DEFAULT_SCRATCH_SEED_SCRIPT;
      if (!seedScript) {
        seedScript = discoverSeedScript(projectRoot) || "";
      }

      if (!seedScript) {
        logger.info(
          "No test data seed script found (checked scripts/apex/seed.apex, data/seed.apex). Skipped."
        );
      } else {
        const resolvedSeed = path.isAbsolute(seedScript)
          ? seedScript
          : path.resolve(projectRoot, seedScript);

        if (!fs.existsSync(resolvedSeed)) {
          logger.warn(`Seed script '${seedScript}' not found at ${resolvedSeed}. Skipped.`);
        } else {
          const seedSpinner = ora({
            text: `Hob is executing test data seed '${seedScript}'...`,
            color: "magenta"
          }).start();

          try {
            if (seedScript.endsWith(".apex")) {
              await runCommand("sf", [
                "apex",
                "run",
                "--file",
                resolvedSeed,
                "--target-org",
                alias
              ]);
            } else if (seedScript.endsWith(".json")) {
              await runCommand("sf", [
                "data",
                "import",
                "tree",
                "--plan",
                resolvedSeed,
                "--target-org",
                alias
              ]);
            } else {
              // Generic file fallback
              await runCommand("sf", [
                "apex",
                "run",
                "--file",
                resolvedSeed,
                "--target-org",
                alias
              ]);
            }
            seedSpinner.succeed(pc.green(`Test data seed '${pc.bold(seedScript)}' applied.`));
          } catch (err: any) {
            seedSpinner.warn(
              pc.yellow(`Test data seed encountered an issue: ${err.message}`)
            );
          }
        }
      }

      // ==========================================
      // Step 5: Open browser
      // ==========================================
      console.log();
      if (options.open !== false) {
        logger.step(5, 5, "Opening the castle gates in your browser...");
        const openSpinner = ora({
          text: "Hob is launching your browser to the new scratch org...",
          color: "magenta"
        }).start();

        const openArgs = ["org", "open", "--target-org", alias];
        if (options.browser) {
          openArgs.push("--browser", options.browser);
        }

        try {
          await runCommand("sf", openArgs);
          openSpinner.succeed(pc.green("Scratch org opened in browser."));
        } catch (err: any) {
          openSpinner.warn(pc.yellow(`Could not open browser: ${err.message}`));
        }
      } else {
        logger.step(5, 5, "Browser launch skipped (--no-open specified).");
      }

      // ==========================================
      // Completed Summary
      // ==========================================
      console.log();
      logger.success(`Scratch org '${pc.bold(alias)}' is fully kindled and ready!`);
      if (scratchUsername) {
        console.log(`  ${pc.bold("Username:")} ${pc.white(scratchUsername)}`);
      }
      if (scratchOrgId) {
        console.log(`  ${pc.bold("Org ID:")}   ${pc.dim(scratchOrgId)}`);
      }
      console.log();
      logger.elf(
        "All chores complete. Hob retreats to the shadows until you need him next 🧦"
      );
      console.log();
    });
}
