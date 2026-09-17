import { Command } from "commander";
import { logger } from "../../utils/logger.js";
import { handleSeedImport, SeedImportOptions } from "./import.js";
import { registerSeedExportCommand } from "./export.js";
import { registerSeedInitCommand } from "./init.js";

export function registerSeedCommand(program: Command): void {
  const seedCmd = program
    .command("seed [file]")
    .description("Seed test data into an org, or export/initialize lightweight scratch org data plans")
    .option("-o, --target-org <org>", "Target org username or alias")
    .option("-p, --plan <plan>", "Plan definition file to insert")
    .option("-f, --files <files...>", "Direct JSON data files to insert")
    .option("--apex <script>", "Apex seed script to run")
    .action(async (file: string | undefined, options: SeedImportOptions) => {
      logger.banner();
      await handleSeedImport(file, options);
    });

  registerSeedExportCommand(seedCmd);
  registerSeedInitCommand(seedCmd);
}
