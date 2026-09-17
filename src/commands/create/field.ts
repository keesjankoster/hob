import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import {
  deriveBaseName,
  isStandardObject,
  normalizeCustomObjectName,
  normalizeFieldName,
  pluralize,
  toTitleCase
} from "../../utils/strings.js";
import { CustomFieldType, generateCustomFieldMeta } from "../../utils/xml.js";

const VALID_FIELD_TYPES: CustomFieldType[] = [
  "Text",
  "Number",
  "Currency",
  "Checkbox",
  "Date",
  "DateTime",
  "Picklist",
  "LongTextArea",
  "Lookup",
  "Percent",
  "Email",
  "Phone",
  "Url"
];

interface CreateFieldOptions {
  type?: string;
  label?: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  unique?: boolean;
  externalId?: boolean;
  length?: string;
  precision?: string;
  scale?: string;
  values?: string | string[];
  referenceTo?: string;
  relationshipName?: string;
  relationshipLabel?: string;
  defaultValue?: string;
  outputDir?: string;
}

export function registerCreateFieldCommand(parentCommand: Command): void {
  parentCommand
    .command("field")
    .description("Scaffold a Salesforce Custom Field with XML metadata")
    .argument("<object>", "Target sObject API name (e.g. Account, Property__c, Expense)")
    .argument("<name>", "API name of the field (e.g. Amount, Status__c, Category)")
    .option(
      "-t, --type <type>",
      `Field type (${VALID_FIELD_TYPES.join(", ")})`,
      "Text"
    )
    .option("-l, --label <label>", "UI label for the custom field")
    .option("-d, --description <desc>", "Description of the field")
    .option("--help-text <text>", "Inline help text for users")
    .option("-r, --required", "Mark field as required", false)
    .option("--unique", "Mark field as unique", false)
    .option("--external-id", "Mark field as an external ID", false)
    .option("--length <length>", "Length for Text (default: 255) or LongTextArea (default: 32768)")
    .option("--precision <precision>", "Precision for Number, Currency, or Percent (default: 18)")
    .option("--scale <scale>", "Scale (decimal places) for Number, Currency, or Percent (default: 2)")
    .option(
      "--values <values...>",
      "Picklist values (space or comma separated)"
    )
    .option("--reference-to <object>", "Target sObject for Lookup fields (e.g. Contact, Account)")
    .option("--relationship-name <name>", "Relationship name for Lookup fields")
    .option("--relationship-label <label>", "Relationship label for Lookup fields")
    .option("--default-value <val>", "Default value (e.g. false for Checkbox)")
    .option("-o, --output-dir <dir>", "Directory for saving the field metadata")
    .action(async (rawObject: string, rawName: string, options: CreateFieldOptions) => {
      logger.banner();

      const sfdxInfo = getSfdxProjectInfo();
      const baseObjectsDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.objects;

      // Determine object name
      let objectApiName = rawObject.trim();
      const directDir = path.join(baseObjectsDir, objectApiName);
      const customObjDir = path.join(baseObjectsDir, `${objectApiName}__c`);
      const cmdtDir = path.join(baseObjectsDir, `${objectApiName}__mdt`);

      if (fs.existsSync(directDir)) {
        // Direct folder exists
      } else if (fs.existsSync(customObjDir)) {
        objectApiName = `${objectApiName}__c`;
      } else if (fs.existsSync(cmdtDir)) {
        objectApiName = `${objectApiName}__mdt`;
      } else if (
        !isStandardObject(objectApiName) &&
        !objectApiName.endsWith("__c") &&
        !objectApiName.endsWith("__mdt")
      ) {
        objectApiName = normalizeCustomObjectName(objectApiName);
      }

      // Determine field API name
      const fieldApiName = normalizeFieldName(rawName);
      const baseFieldName = deriveBaseName(fieldApiName);
      const label = options.label || toTitleCase(baseFieldName);

      // Validate field type
      const normalizedTypeInput = (options.type || "Text").trim().toLowerCase();
      const matchedType = VALID_FIELD_TYPES.find(
        (t) => t.toLowerCase() === normalizedTypeInput
      );

      if (!matchedType) {
        logger.error(
          `Invalid field type '${options.type}'. Valid types: ${VALID_FIELD_TYPES.join(", ")}`
        );
        process.exit(1);
      }

      // Target fields directory
      const fieldsDir = path.join(baseObjectsDir, objectApiName, "fields");
      const metaFilePath = path.join(fieldsDir, `${fieldApiName}.field-meta.xml`);

      if (fs.existsSync(metaFilePath)) {
        logger.error(`Field metadata already exists: ${metaFilePath}`);
        process.exit(1);
      }

      // Ensure directory exists
      fs.mkdirSync(fieldsDir, { recursive: true });

      // Parse picklist values
      let picklistValues: string[] = [];
      if (options.values) {
        const rawValues = Array.isArray(options.values) ? options.values : [options.values];
        picklistValues = rawValues
          .flatMap((v) => v.split(/[,\s]+/))
          .map((v) => v.trim())
          .filter(Boolean);
      }

      // Lookup relationships
      let referenceTo = options.referenceTo;
      let relationshipName = options.relationshipName;
      let relationshipLabel = options.relationshipLabel;

      if (matchedType === "Lookup") {
        if (!referenceTo) {
          logger.warn("Lookup field created without --reference-to. Defaulting to 'Account'.");
          referenceTo = "Account";
        }
        if (!relationshipName) {
          relationshipName = pluralize(deriveBaseName(objectApiName));
        }
        if (!relationshipLabel) {
          relationshipLabel = toTitleCase(relationshipName);
        }
      }

      const xmlContent = generateCustomFieldMeta({
        fullName: fieldApiName,
        label,
        type: matchedType,
        description: options.description,
        inlineHelpText: options.helpText,
        required: options.required,
        unique: options.unique,
        externalId: options.externalId,
        length: options.length ? parseInt(options.length, 10) : undefined,
        precision: options.precision ? parseInt(options.precision, 10) : undefined,
        scale: options.scale ? parseInt(options.scale, 10) : undefined,
        picklistValues: picklistValues.length > 0 ? picklistValues : undefined,
        referenceTo,
        relationshipName,
        relationshipLabel,
        defaultValue: options.defaultValue
      });

      fs.writeFileSync(metaFilePath, xmlContent, "utf-8");

      logger.success(`Created Custom Field '${pc.bold(fieldApiName)}' on '${pc.bold(objectApiName)}'`);

      console.log();
      logger.elf("Hob crafted your custom field definition:");
      console.log();
      console.log(`  ${pc.bold("Object:")}        ${pc.cyan(objectApiName)}`);
      console.log(`  ${pc.bold("Field:")}         ${pc.green(fieldApiName)}`);
      console.log(`  ${pc.bold("Label:")}         ${label}`);
      console.log(`  ${pc.bold("Type:")}          ${matchedType}`);
      if (matchedType === "Lookup" && referenceTo) {
        console.log(`  ${pc.bold("Lookup To:")}     ${referenceTo}`);
      }
      if (matchedType === "Picklist" && picklistValues.length > 0) {
        console.log(`  ${pc.bold("Values:")}        ${picklistValues.join(", ")}`);
      }
      console.log(`  ${pc.bold("File:")}          ${pc.dim(metaFilePath)}`);
      console.log();
    });
}
