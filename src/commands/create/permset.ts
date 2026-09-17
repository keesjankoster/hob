import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import { deriveBaseName, toTitleCase } from "../../utils/strings.js";
import { generatePermissionSetMeta } from "../../utils/xml.js";

interface CreatePermsetOptions {
  label?: string;
  description?: string;
  license?: string;
  objects?: string | string[];
  classes?: string | string[];
  outputDir?: string;
}

export function registerCreatePermsetCommand(parentCommand: Command): void {
  parentCommand
    .command("permset")
    .alias("permission-set")
    .description("Scaffold a Salesforce Permission Set XML metadata file")
    .argument("<name>", "Developer/API name of the permission set (e.g. Billing_Admin)")
    .option("-l, --label <label>", "UI label for the permission set")
    .option("-d, --description <desc>", "Description of the permissions granted")
    .option("--license <license>", "User license API name (e.g. Salesforce)")
    .option(
      "--objects <objects...>",
      "sObjects to pre-populate with CRUD permissions (space or comma separated)"
    )
    .option(
      "--classes <classes...>",
      "Apex classes to pre-populate with execution permissions (space or comma separated)"
    )
    .option("-o, --output-dir <dir>", "Directory for saving the permission set")
    .action(async (rawName: string, options: CreatePermsetOptions) => {
      logger.banner();

      const permsetName = rawName.replace(/\s+/g, "_");
      const baseName = deriveBaseName(permsetName);
      const label = options.label || toTitleCase(baseName);

      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.permissionsets;

      const metaFilePath = path.join(targetDir, `${permsetName}.permissionset-meta.xml`);

      if (fs.existsSync(metaFilePath)) {
        logger.error(`Permission set file already exists: ${metaFilePath}`);
        process.exit(1);
      }

      // Ensure directory exists
      fs.mkdirSync(targetDir, { recursive: true });

      // Parse objects list
      let objects: string[] = [];
      if (options.objects) {
        const raw = Array.isArray(options.objects) ? options.objects : [options.objects];
        objects = raw
          .flatMap((o) => o.split(/[,\s]+/))
          .map((o) => o.trim())
          .filter(Boolean);
      }

      // Parse classes list
      let classes: string[] = [];
      if (options.classes) {
        const raw = Array.isArray(options.classes) ? options.classes : [options.classes];
        classes = raw
          .flatMap((c) => c.split(/[,\s]+/))
          .map((c) => c.trim())
          .filter(Boolean);
      }

      const xmlContent = generatePermissionSetMeta({
        label,
        description: options.description,
        license: options.license,
        objects: objects.length > 0 ? objects : undefined,
        classes: classes.length > 0 ? classes : undefined
      });

      fs.writeFileSync(metaFilePath, xmlContent, "utf-8");

      logger.success(`Created Permission Set '${pc.bold(permsetName)}'`);

      console.log();
      logger.elf("Hob's wand granted the permission set boilerplate:");
      console.log();
      console.log(`  ${pc.bold("Name:")}        ${pc.cyan(permsetName)}`);
      console.log(`  ${pc.bold("Label:")}       ${label}`);
      if (options.license) {
        console.log(`  ${pc.bold("License:")}     ${options.license}`);
      }
      if (objects.length > 0) {
        console.log(`  ${pc.bold("Objects:")}     ${objects.join(", ")}`);
      }
      if (classes.length > 0) {
        console.log(`  ${pc.bold("Apex:")}        ${classes.join(", ")}`);
      }
      console.log(`  ${pc.bold("File:")}        ${pc.dim(metaFilePath)}`);
      console.log();
      logger.elf(`Assign to your active org with: ${pc.cyan(`sf org assign permset -n ${permsetName}`)}`);
      console.log();
    });
}
