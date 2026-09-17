import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../../utils/logger.js";
import { ensureCommand, runCommand } from "../../utils/runner.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import { DEFAULT_SEED_DIR } from "../../constants.js";

export interface SeedExportOptions {
  query?: string | string[];
  sobjects?: string | string[];
  outputDir?: string;
  prefix?: string;
  plan?: boolean;
  targetOrg?: string;
}

/**
 * Builds default lightweight queries for common objects when shortcut --sobjects is used
 */
function buildDefaultQueries(sobjects: string[]): string[] {
  const queries: string[] = [];

  for (const obj of sobjects) {
    const trimmed = obj.trim();
    if (trimmed.toLowerCase() === "account") {
      queries.push("SELECT Id, Name, BillingCity, BillingCountry, (SELECT Id, FirstName, LastName, Email FROM Contacts) FROM Account LIMIT 50");
    } else if (trimmed.toLowerCase() === "contact") {
      queries.push("SELECT Id, FirstName, LastName, Email, Title FROM Contact LIMIT 50");
    } else if (trimmed.toLowerCase() === "opportunity") {
      queries.push("SELECT Id, Name, StageName, CloseDate, Amount FROM Opportunity LIMIT 50");
    } else {
      queries.push(`SELECT Id, Name FROM ${trimmed} LIMIT 50`);
    }
  }

  return queries;
}

export function registerSeedExportCommand(seedCmd: Command): void {
  seedCmd
    .command("export")
    .description("Export lightweight scratch org data plans and sObject JSON trees from an org")
    .option("-q, --query <soql...>", "SOQL query or queries to export")
    .option(
      "-s, --sobjects <objects...>",
      "Shortcut: export sample records from specified sObjects (e.g. Account, Contact)"
    )
    .option("-d, --output-dir <dir>", "Directory to store exported JSON files", DEFAULT_SEED_DIR)
    .option("-x, --prefix <prefix>", "Prefix for generated JSON files", "seed")
    .option("-p, --plan", "Generate a multi-object plan definition file for aggregated import", true)
    .option("--no-plan", "Do not generate a plan definition file")
    .option("-o, --target-org <org>", "Source org username or alias (defaults to default org)")
    .action(async (options: SeedExportOptions) => {
      logger.banner();

      await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = path.isAbsolute(options.outputDir || DEFAULT_SEED_DIR)
        ? options.outputDir!
        : path.resolve(sfdxInfo.projectRoot, options.outputDir || DEFAULT_SEED_DIR);

      fs.mkdirSync(targetDir, { recursive: true });

      // Gather queries
      const queries: string[] = [];
      if (options.query) {
        const raw = Array.isArray(options.query) ? options.query : [options.query];
        queries.push(...raw.map((q) => q.trim()).filter(Boolean));
      }

      if (options.sobjects) {
        const raw = Array.isArray(options.sobjects) ? options.sobjects : [options.sobjects];
        const objs = raw.flatMap((o) => o.split(/[,\s]+/)).map((o) => o.trim()).filter(Boolean);
        queries.push(...buildDefaultQueries(objs));
      }

      if (queries.length === 0) {
        // Fallback default sample query
        queries.push("SELECT Id, Name, (SELECT Id, FirstName, LastName, Email FROM Contacts) FROM Account LIMIT 20");
        logger.info("No query specified. Exporting sample Account & Contact hierarchy.");
      }

      const sourceOrg = options.targetOrg || "default org";

      console.log();
      logger.elf(`Hob is harvesting test data from '${pc.bold(pc.cyan(sourceOrg))}' into '${pc.cyan(options.outputDir || DEFAULT_SEED_DIR)}'...`);
      console.log();

      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        const prefix = queries.length > 1 ? `${options.prefix || "seed"}-${i + 1}` : (options.prefix || "seed");

        const spinner = ora({
          text: `Hob is harvesting records for: ${pc.dim(q)}...`,
          color: "magenta"
        }).start();

        const sfArgs = [
          "data",
          "export",
          "tree",
          "--query",
          q,
          "--output-dir",
          targetDir,
          "--prefix",
          prefix
        ];

        if (options.plan !== false) {
          sfArgs.push("--plan");
        }

        if (options.targetOrg) {
          sfArgs.push("--target-org", options.targetOrg);
        }

        try {
          await runCommand("sf", sfArgs);
          spinner.succeed(pc.green(`Exported data tree for query ${i + 1}/${queries.length}`));
        } catch (err: any) {
          spinner.fail(pc.red(`Failed to export query: ${err.message}`));
        }
      }

      console.log();
      logger.success("Data export completed!");
      console.log();
      logger.elf(`Import your new data plan anytime with: ${pc.cyan("hob seed")}`);
      console.log();
    });
}
