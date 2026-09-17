import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import {
  deriveBaseName,
  normalizeCmdtName,
  pluralize,
  toTitleCase,
  isValidSObjectName,
  isValidSalesforceIdentifier
} from "../../utils/strings.js";
import {
  generateCustomMetadataTypeMeta,
  generateCustomMetadataRecordMeta
} from "../../utils/xml.js";

interface CreateCmdtOptions {
  label?: string;
  pluralLabel?: string;
  description?: string;
  visibility?: "Public" | "Protected";
  withRecord?: boolean | string;
  outputDir?: string;
}

export function registerCreateCmdtCommand(parentCommand: Command): void {
  parentCommand
    .command("cmdt")
    .alias("custom-metadata")
    .description("Scaffold a Custom Metadata Type (CMDT) and optional starter record")
    .argument("<name>", "Developer/API name of the custom metadata type (e.g. App_Config, Feature_Flag__mdt)")
    .option("-l, --label <label>", "Singular label for the custom metadata type")
    .option("-p, --plural-label <plural>", "Plural label for the custom metadata type")
    .option("-d, --description <desc>", "Description of the custom metadata type")
    .option(
      "--visibility <visibility>",
      "Visibility (Public or Protected)",
      "Public"
    )
    .option(
      "-r, --with-record [recordName]",
      "Scaffold an initial sample record in customMetadata/ (default record name: Default)"
    )
    .option("-o, --output-dir <dir>", "Directory for saving the object bundle")
    .action(async (rawName: string, options: CreateCmdtOptions) => {
      logger.banner();

      if (!isValidSObjectName(rawName)) {
        logger.error(
          `Invalid Custom Metadata Type name '${rawName}'. Must start with a letter and contain only alphanumeric characters and underscores (e.g. App_Config, Feature_Flag__mdt).`
        );
        process.exit(1);
      }

      if (typeof options.withRecord === "string" && !isValidSalesforceIdentifier(options.withRecord)) {
        logger.error(
          `Invalid starter record name '${options.withRecord}'. Must start with a letter and contain only alphanumeric characters and underscores.`
        );
        process.exit(1);
      }

      const cmdtApiName = normalizeCmdtName(rawName);
      const baseName = deriveBaseName(cmdtApiName);
      const label = options.label || toTitleCase(baseName);
      const pluralLabel = options.pluralLabel || pluralize(label);

      const sfdxInfo = getSfdxProjectInfo();
      const baseObjectsDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.objects;

      const cmdtDir = path.join(baseObjectsDir, cmdtApiName);
      const fieldsDir = path.join(cmdtDir, "fields");
      const metaFilePath = path.join(cmdtDir, `${cmdtApiName}.object-meta.xml`);

      if (fs.existsSync(metaFilePath)) {
        logger.error(`Custom Metadata Type metadata already exists: ${metaFilePath}`);
        process.exit(1);
      }

      // Ensure directory and fields/ subfolder exist
      fs.mkdirSync(fieldsDir, { recursive: true });

      const visibility =
        options.visibility?.toLowerCase() === "protected" ? "Protected" : "Public";

      const xmlContent = generateCustomMetadataTypeMeta({
        label,
        pluralLabel,
        description: options.description,
        visibility
      });

      fs.writeFileSync(metaFilePath, xmlContent, "utf-8");

      logger.success(`Created Custom Metadata Type '${pc.bold(cmdtApiName)}'`);

      // Optionally scaffold starter record in customMetadata/
      let recordFilePath: string | undefined;
      if (options.withRecord !== undefined && options.withRecord !== false) {
        const rawRecordName =
          typeof options.withRecord === "string" && options.withRecord.trim() !== ""
            ? options.withRecord.trim()
            : "Default";
        const recordName = rawRecordName.replace(/\s+/g, "_");
        const recordLabel = toTitleCase(recordName);

        const customMetadataDir = options.outputDir
          ? path.resolve(process.cwd(), options.outputDir, "../customMetadata")
          : sfdxInfo.paths.customMetadata;
        fs.mkdirSync(customMetadataDir, { recursive: true });

        recordFilePath = path.join(
          customMetadataDir,
          `${baseName}.${recordName}.md-meta.xml`
        );

        if (!fs.existsSync(recordFilePath)) {
          const recordXml = generateCustomMetadataRecordMeta({
            label: recordLabel,
            isProtected: visibility === "Protected"
          });
          fs.writeFileSync(recordFilePath, recordXml, "utf-8");
          logger.success(`Created initial CMDT record '${pc.bold(`${baseName}.${recordName}`)}'`);
        }
      }

      console.log();
      logger.elf("Hob prepared your Custom Metadata Type (CMDT):");
      console.log();
      console.log(`  ${pc.bold("API Name:")}     ${pc.cyan(cmdtApiName)}`);
      console.log(`  ${pc.bold("Label:")}        ${label} (Plural: ${pluralLabel})`);
      console.log(`  ${pc.bold("Visibility:")}   ${visibility}`);
      console.log(`  ${pc.bold("Directory:")}    ${pc.dim(cmdtDir)}`);
      console.log(`  ${pc.bold("Fields Dir:")}   ${pc.dim(fieldsDir)}`);
      console.log(`  ${pc.bold("Metadata:")}     ${cmdtApiName}.object-meta.xml`);
      if (recordFilePath) {
        console.log(`  ${pc.bold("Record:")}       ${pc.dim(recordFilePath)}`);
      }
      console.log();
      logger.elf(
        `Add custom fields with: ${pc.cyan(`hob create field ${cmdtApiName} <FieldName>`)}`
      );
      console.log();
    });
}
