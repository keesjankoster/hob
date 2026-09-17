import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import {
  deriveBaseName,
  normalizeCustomObjectName,
  pluralize,
  toTitleCase
} from "../../utils/strings.js";
import { generateCustomObjectMeta } from "../../utils/xml.js";

interface CreateObjectOptions {
  label?: string;
  pluralLabel?: string;
  nameFieldType?: "Text" | "AutoNumber";
  nameFieldLabel?: string;
  autoNumberFormat?: string;
  description?: string;
  sharingModel?: "ReadWrite" | "Private" | "Read";
  outputDir?: string;
}

export function registerCreateObjectCommand(parentCommand: Command): void {
  parentCommand
    .command("object")
    .description("Scaffold a Salesforce Custom Object with directory and metadata")
    .argument("<name>", "Developer/API name of the custom object (e.g. Property, Expense__c)")
    .option("-l, --label <label>", "Singular label for the custom object")
    .option("-p, --plural-label <plural>", "Plural label for the custom object")
    .option(
      "--name-field-type <type>",
      "Type of the record Name field (Text or AutoNumber)",
      "Text"
    )
    .option("--name-field-label <label>", "Label for the record Name field")
    .option(
      "--auto-number-format <format>",
      "Display format for AutoNumber name field (e.g. PROP-{0000})"
    )
    .option("-d, --description <desc>", "Description of the custom object")
    .option(
      "--sharing-model <model>",
      "Sharing model (ReadWrite, Private, Read)",
      "ReadWrite"
    )
    .option("-o, --output-dir <dir>", "Directory for saving the object bundle")
    .action(async (rawName: string, options: CreateObjectOptions) => {
      logger.banner();

      const objectApiName = normalizeCustomObjectName(rawName);
      const baseName = deriveBaseName(objectApiName);
      const label = options.label || toTitleCase(baseName);
      const pluralLabel = options.pluralLabel || pluralize(label);

      const sfdxInfo = getSfdxProjectInfo();
      const baseObjectsDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.objects;

      const objectDir = path.join(baseObjectsDir, objectApiName);
      const fieldsDir = path.join(objectDir, "fields");
      const metaFilePath = path.join(objectDir, `${objectApiName}.object-meta.xml`);

      if (fs.existsSync(metaFilePath)) {
        logger.error(`Custom object metadata already exists: ${metaFilePath}`);
        process.exit(1);
      }

      // Ensure object directory and fields subfolder exist
      fs.mkdirSync(fieldsDir, { recursive: true });

      const nameFieldType =
        options.nameFieldType?.toLowerCase() === "autonumber" ? "AutoNumber" : "Text";
      const autoNumberFormat =
        options.autoNumberFormat ||
        `${baseName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "OBJ")}-{0000}`;

      const xmlContent = generateCustomObjectMeta({
        label,
        pluralLabel,
        description: options.description,
        nameFieldType,
        nameFieldLabel: options.nameFieldLabel,
        autoNumberFormat,
        sharingModel: options.sharingModel
      });

      fs.writeFileSync(metaFilePath, xmlContent, "utf-8");

      logger.success(`Created Custom Object '${pc.bold(objectApiName)}'`);

      console.log();
      logger.elf("Hob prepared your custom object and fields directory:");
      console.log();
      console.log(`  ${pc.bold("API Name:")}     ${pc.cyan(objectApiName)}`);
      console.log(`  ${pc.bold("Label:")}        ${label} (Plural: ${pluralLabel})`);
      console.log(`  ${pc.bold("Name Field:")}   ${nameFieldType}`);
      console.log(`  ${pc.bold("Directory:")}    ${pc.dim(objectDir)}`);
      console.log(`  ${pc.bold("Fields Dir:")}   ${pc.dim(fieldsDir)}`);
      console.log(`  ${pc.bold("Metadata:")}     ${objectApiName}.object-meta.xml`);
      console.log();
      logger.elf(`Add fields to this object with: ${pc.cyan(`hob create field ${objectApiName} <FieldName>`)}`);
      console.log();
    });
}
