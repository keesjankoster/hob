import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../../utils/logger.js";
import { ensureCommand, runCommand } from "../../utils/runner.js";
import { DEFAULT_DEVHUB_ALIAS } from "../../constants.js";

export interface ScratchPurgeOptions {
  targetDevHub?: string;
  expiredOnly?: boolean;
  activeOnly?: boolean;
  noPrompt?: boolean;
  force?: boolean;
  dryRun?: boolean;
  includeUnknown?: boolean;
}

interface DevHubOrg {
  alias?: string;
  username: string;
  orgId: string;
  isDefaultDevHubUsername?: boolean;
}

interface ScratchOrgInfo {
  orgId: string;
  username: string;
  alias?: string;
  devHubUsername?: string;
  devHubOrgId?: string;
  isExpired?: boolean;
  expirationDate?: string;
  status?: string;
}

function pad(text: string, width: number, style?: (s: string) => string): string {
  const padded = text.padEnd(width);
  return style ? style(padded) : padded;
}

export function registerScratchPurgeCommand(scratchCmd: Command): void {
  scratchCmd
    .command("purge")
    .description(
      "Find and delete expired and active scratch orgs linked to the Dev Hub to keep limits clean"
    )
    .option("-v, --target-dev-hub <devhub>", "Target Dev Hub org alias or username")
    .option("--expired-only", "Only delete expired scratch orgs")
    .option("--active-only", "Only delete active scratch orgs")
    .option("-p, --no-prompt", "Do not prompt for confirmation before deleting", false)
    .option("-f, --force", "Force deletion without prompt (same as --no-prompt)")
    .option("--dry-run", "Display scratch orgs that would be deleted without deleting them")
    .option(
      "--include-unknown",
      "Include scratch orgs whose Dev Hub relationship is unconfirmed",
      false
    )
    .action(async (options: ScratchPurgeOptions) => {
      logger.banner();

      await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

      const spinner = ora({
        text: "Hob is inspecting the Dev Hub hearth for scratch orgs...",
        color: "magenta"
      }).start();

      let devHubs: DevHubOrg[] = [];
      let allScratchOrgs: ScratchOrgInfo[] = [];

      try {
        const { stdout } = await runCommand("sf", ["org", "list", "--json"]);
        const data = JSON.parse(stdout);
        devHubs = data.result?.devHubs ?? [];
        allScratchOrgs = data.result?.scratchOrgs ?? [];
        spinner.stop();
      } catch (err: any) {
        spinner.fail("Failed to retrieve org list from Salesforce CLI.");
        logger.error(err.message);
        process.exit(1);
      }

      // Identify target Dev Hub
      let targetHub: DevHubOrg | undefined;
      if (options.targetDevHub) {
        targetHub = devHubs.find(
          (h) =>
            h.alias?.toLowerCase() === options.targetDevHub!.toLowerCase() ||
            h.username.toLowerCase() === options.targetDevHub!.toLowerCase()
        );
      } else {
        // Default Dev Hub
        targetHub =
          devHubs.find((h) => h.isDefaultDevHubUsername) ||
          devHubs.find((h) => h.alias === DEFAULT_DEVHUB_ALIAS) ||
          (devHubs.length > 0 ? devHubs[0] : undefined);
      }

      if (!targetHub && !options.targetDevHub) {
        logger.error("No Dev Hub (hearth) found. Please light one first using 'hob hearth'.");
        console.log();
        process.exit(1);
      }

      const hubIdentifier = targetHub ? targetHub.username : options.targetDevHub!;
      const hubDisplayName = targetHub?.alias ? `${targetHub.alias} (${targetHub.username})` : hubIdentifier;

      console.log();
      logger.elf(`Hob is examining scratch orgs linked to Dev Hub '${pc.bold(pc.cyan(hubDisplayName))}'...`);
      console.log();

      // Filter scratch orgs linked to this Dev Hub (strict, safe matching)
      const unknownHubOrgs: ScratchOrgInfo[] = [];
      let linkedOrgs = allScratchOrgs.filter((org) => {
        const matchesUsername =
          org.devHubUsername &&
          (org.devHubUsername.toLowerCase() === hubIdentifier.toLowerCase() ||
            (targetHub?.alias && org.devHubUsername.toLowerCase() === targetHub.alias.toLowerCase()));

        const matchesOrgId =
          org.devHubOrgId && targetHub?.orgId && org.devHubOrgId.toLowerCase() === targetHub.orgId.toLowerCase();

        if (matchesUsername || matchesOrgId) {
          return true;
        }

        if (!org.devHubUsername && !org.devHubOrgId) {
          unknownHubOrgs.push(org);
          return Boolean(options.includeUnknown);
        }

        return false;
      });

      if (unknownHubOrgs.length > 0 && !options.includeUnknown) {
        logger.info(
          pc.dim(
            `Notice: Skipped ${unknownHubOrgs.length} scratch org(s) with unconfirmed Dev Hub ownership (use --include-unknown to include).`
          )
        );
        console.log();
      }

      // Filter by status if specified
      if (options.expiredOnly) {
        linkedOrgs = linkedOrgs.filter(
          (org) => org.isExpired || org.status?.toLowerCase() === "expired"
        );
      } else if (options.activeOnly) {
        linkedOrgs = linkedOrgs.filter(
          (org) => !org.isExpired && org.status?.toLowerCase() !== "expired"
        );
      }

      if (linkedOrgs.length === 0) {
        logger.success(
          `No ${options.expiredOnly ? "expired " : options.activeOnly ? "active " : ""}scratch orgs found linked to Dev Hub '${hubDisplayName}'.`
        );
        logger.elf("The hearth is already tidy and limits are clean! 🧦");
        console.log();

        // Still run a quick clean of any dead local auth references
        try {
          await runCommand("sf", ["org", "list", "--clean", "--no-prompt"]);
        } catch {
          // Ignore
        }
        return;
      }

      // Display table of orgs to be purged
      console.log(
        pc.bold(
          pc.yellow(
            `Hob found ${linkedOrgs.length} scratch org(s) to purge:`
          )
        )
      );
      console.log();

      const colAlias = "Alias".padEnd(18);
      const colStatus = "Status".padEnd(12);
      const colExp = "Expires".padEnd(14);
      const colOrgId = "Org Id".padEnd(20);
      const colUsername = "Username";

      console.log(pc.bold(pc.cyan(`  ${colAlias}${colStatus}${colExp}${colOrgId}${colUsername}`)));
      console.log(
        pc.dim(
          `  ${"─".repeat(16)}  ${"─".repeat(10)}  ${"─".repeat(12)}  ${"─".repeat(18)}  ${"─".repeat(30)}`
        )
      );

      for (const org of linkedOrgs) {
        const alias = pad(org.alias || "(none)", 18, org.alias ? undefined : pc.dim);
        const isExp = org.isExpired || org.status?.toLowerCase() === "expired";
        const status = pad(
          isExp ? "Expired" : "Active",
          12,
          isExp ? pc.red : pc.green
        );
        const expDate = pad(org.expirationDate || "Unknown", 14, pc.dim);
        const orgId = pad(org.orgId || "Unknown", 20);
        const username = pc.white(org.username);

        console.log(`  ${alias}${status}${expDate}${orgId}${username}`);
      }
      console.log();

      if (options.dryRun) {
        logger.info(
          `[Dry Run] No scratch orgs deleted. ${linkedOrgs.length} org(s) would be purged.`
        );
        console.log();
        return;
      }

      // Confirmation prompt if not forced or --no-prompt
      const skipPrompt = options.noPrompt || options.force;
      if (!skipPrompt) {
        const rl = readline.createInterface({ input, output });
        const answer = await rl.question(
          pc.bold(
            pc.yellow(
              `⚠  Hob is about to permanently delete ${linkedOrgs.length} scratch org(s). Proceed? [y/N]: `
            )
          )
        );
        rl.close();

        const confirmed = answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
        if (!confirmed) {
          console.log();
          logger.info("Purge cancelled by user. No scratch orgs were deleted.");
          console.log();
          return;
        }
      }

      console.log();
      logger.elf("Hob is sweeping the hearth and releasing scratch org allocations...");
      console.log();

      let successCount = 0;
      let failCount = 0;

      for (const org of linkedOrgs) {
        const identifier = org.alias || org.username;
        const delSpinner = ora({
          text: `Hob is extinguishing scratch org '${pc.bold(identifier)}'...`,
          color: "magenta"
        }).start();

        try {
          await runCommand("sf", [
            "org",
            "delete",
            "scratch",
            "--target-org",
            org.username,
            "--no-prompt"
          ]);
          delSpinner.succeed(
            pc.green(`Scratch org '${pc.bold(identifier)}' deleted.`)
          );
          successCount++;
        } catch (err: any) {
          delSpinner.fail(
            pc.red(`Failed to delete scratch org '${identifier}': ${err.message}`)
          );
          failCount++;
        }
      }

      // Clean local references
      const cleanSpinner = ora({
        text: "Hob is sweeping up leftover ashes and expired authorizations...",
        color: "magenta"
      }).start();

      try {
        await runCommand("sf", ["org", "list", "--clean", "--no-prompt"]);
        cleanSpinner.succeed(pc.green("Local scratch org authorizations swept clean."));
      } catch {
        cleanSpinner.warn(pc.yellow("Could not complete final authorization sweep."));
      }

      console.log();
      if (failCount === 0) {
        logger.success(
          `Purge complete! ${successCount} scratch org(s) successfully deleted.`
        );
      } else {
        logger.warn(
          `Purge finished with warnings: ${successCount} deleted, ${failCount} failed.`
        );
      }
      logger.elf("Dev Hub limits are refreshed and the hearth is sparkling clean! 🧦");
      console.log();
    });
}
