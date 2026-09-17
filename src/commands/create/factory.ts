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
  toPascalCase,
  isValidSObjectName,
  isValidSalesforceIdentifier
} from "../../utils/strings.js";
import { generateApexClassMeta } from "../../utils/xml.js";

interface CreateFactoryOptions {
  name?: string;
  outputDir?: string;
}

/**
 * Generates initial field values boilerplate based on standard vs custom fields
 */
function getDefaultFieldsCode(sobject: string, baseName: string): string {
  if (sobject === "Account") {
    return `            Name = 'Test ' + baseName + ' ' + index,\n            BillingCity = 'San Francisco',\n            BillingCountry = 'USA'`;
  }
  if (sobject === "Contact") {
    return `            FirstName = 'Test',\n            LastName = 'Contact ' + index,\n            Email = 'test' + index + '@example.com'`;
  }
  if (sobject === "Opportunity") {
    return `            Name = 'Test Opportunity ' + index,\n            StageName = 'Prospecting',\n            CloseDate = Date.today().addDays(30),\n            Amount = 10000`;
  }
  if (sobject === "Case") {
    return `            Subject = 'Test Case ' + index,\n            Status = 'New',\n            Origin = 'Web'`;
  }
  if (sobject.endsWith("__c")) {
    return `            Name = 'Test ' + baseName + ' ' + index`;
  }
  return `            Name = 'Test ' + baseName + ' ' + index`;
}

export function registerCreateFactoryCommand(parentCommand: Command): void {
  parentCommand
    .command("factory")
    .description("Scaffold an Apex Test Data Factory with build (in-memory) and create (DML) methods")
    .argument("<sobject>", "Target sObject API name (e.g. Account, Contact, Property__c)")
    .option("-n, --name <name>", "Override the factory class name (default: <SObject>DataFactory)")
    .option("-d, --output-dir <dir>", "Directory for saving the factory class")
    .action(async (rawSObject: string, options: CreateFactoryOptions) => {
      logger.banner();

      if (!isValidSObjectName(rawSObject)) {
        logger.error(
          `Invalid sObject name '${rawSObject}'. Must be a valid standard or custom sObject name (e.g. Account, Property__c).`
        );
        process.exit(1);
      }

      if (options.name && !isValidSalesforceIdentifier(options.name)) {
        logger.error(
          `Invalid factory class name override '${options.name}'. Must start with a letter and contain only alphanumeric characters and underscores.`
        );
        process.exit(1);
      }

      let sobject = rawSObject.trim();
      if (!isStandardObject(sobject) && !sobject.endsWith("__c") && !sobject.endsWith("__mdt")) {
        sobject = normalizeCustomObjectName(sobject);
      }

      const baseName = deriveBaseName(sobject);
      const className = options.name ? toPascalCase(options.name) : `${baseName}DataFactory`;

      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.classes;

      const classFilePath = path.join(targetDir, `${className}.cls`);
      const metaFilePath = path.join(targetDir, `${className}.cls-meta.xml`);

      if (fs.existsSync(classFilePath)) {
        logger.error(`Apex class file already exists: ${classFilePath}`);
        process.exit(1);
      }

      fs.mkdirSync(targetDir, { recursive: true });

      const defaultFields = getDefaultFieldsCode(sobject, baseName);
      const apiVersion = sfdxInfo.apiVersion;

      const classContent = `@IsTest
public with sharing class ${className} {

    private static Integer index = 1;

    /**
     * Builds a single ${sobject} record in-memory (No DML) for fast unit testing.
     */
    public static ${sobject} build${baseName}() {
        return build${baseName}(new Map<String, Object>());
    }

    /**
     * Builds a single ${sobject} record in-memory with custom field overrides.
     */
    public static ${sobject} build${baseName}(Map<String, Object> fieldOverrides) {
        ${sobject} record = new ${sobject}(
            ${defaultFields}
        );
        index++;
        applyOverrides(record, fieldOverrides);
        return record;
    }

    /**
     * Inserts a single ${sobject} record into the database.
     */
    public static ${sobject} create${baseName}() {
        return create${baseName}(new Map<String, Object>());
    }

    /**
     * Inserts a single ${sobject} record into the database with custom field overrides.
     */
    public static ${sobject} create${baseName}(Map<String, Object> fieldOverrides) {
        ${sobject} record = build${baseName}(fieldOverrides);
        insert record;
        return record;
    }

    /**
     * Builds multiple ${sobject} records in-memory (No DML).
     */
    public static List<${sobject}> build${baseName}List(Integer count) {
        List<${sobject}> records = new List<${sobject}>();
        for (Integer i = 0; i < count; i++) {
            records.add(build${baseName}());
        }
        return records;
    }

    /**
     * Inserts multiple ${sobject} records in bulk into the database.
     */
    public static List<${sobject}> create${baseName}List(Integer count) {
        List<${sobject}> records = build${baseName}List(count);
        insert records;
        return records;
    }

    private static void applyOverrides(SObject record, Map<String, Object> fieldOverrides) {
        if (fieldOverrides == null || fieldOverrides.isEmpty()) {
            return;
        }
        for (String fieldName : fieldOverrides.keySet()) {
            record.put(fieldName, fieldOverrides.get(fieldName));
        }
    }
}
`;

      fs.writeFileSync(classFilePath, classContent, "utf-8");
      fs.writeFileSync(metaFilePath, generateApexClassMeta(apiVersion), "utf-8");

      logger.success(`Created Test Data Factory '${pc.bold(className)}' for '${pc.bold(sobject)}'`);

      console.log();
      logger.elf("Hob crafted your Apex Test Data Factory with clean build vs create separation:");
      console.log();
      console.log(`  ${pc.bold("Class:")}        ${className}.cls`);
      console.log(`  ${pc.bold("Target Object:")}${pc.cyan(sobject)}`);
      console.log(`  ${pc.bold("Directory:")}    ${pc.dim(targetDir)}`);
      console.log();
      console.log(pc.bold(pc.dim("  Sample Test Usage:")));
      console.log(pc.cyan(`    // Fast in-memory unit test record:`));
      console.log(`    ${sobject} r1 = ${className}.build${baseName}();`);
      console.log(pc.cyan(`    // Integration test record with DML:`));
      console.log(`    ${sobject} r2 = ${className}.create${baseName}();`);
      console.log(pc.cyan(`    // Bulk insertion:`));
      console.log(`    List<${sobject}> list1 = ${className}.create${baseName}List(5);`);
      console.log();
    });
}
