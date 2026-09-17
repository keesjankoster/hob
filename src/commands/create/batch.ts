import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import {
  toPascalCase,
  normalizeSObjectName,
  isValidSalesforceIdentifier,
  isValidSObjectName
} from "../../utils/strings.js";
import { generateApexClassMeta } from "../../utils/xml.js";

interface CreateBatchOptions {
  sobject?: string;
  withTest?: boolean;
  outputDir?: string;
}

export function registerCreateBatchCommand(parentCommand: Command): void {
  parentCommand
    .command("batchable <name>")
    .aliases(["batch"])
    .description("Scaffold a Batchable Apex class with optional companion test class")
    .option("-s, --sobject <sobject>", "Target Salesforce object to batch over", "Account")
    .option("--with-test", "Scaffold companion test class pre-populated with Database.executeBatch boilerplate")
    .option("-d, --output-dir <dir>", "Directory for saving the created class")
    .action(async (rawName: string, options: CreateBatchOptions) => {
      logger.banner();

      if (!isValidSalesforceIdentifier(rawName)) {
        logger.error(
          `Invalid Batchable Apex class name '${rawName}'. Must start with a letter and contain only alphanumeric characters and underscores.`
        );
        process.exit(1);
      }

      if (options.sobject && !isValidSObjectName(options.sobject)) {
        logger.error(
          `Invalid sObject name '${options.sobject}'. Must be a valid standard or custom sObject name (e.g. Account, Property__c).`
        );
        process.exit(1);
      }

      const name = toPascalCase(rawName);
      const sobject = options.sobject ? normalizeSObjectName(options.sobject) : "Account";
      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.classes;

      const classFilePath = path.join(targetDir, `${name}.cls`);
      const metaFilePath = path.join(targetDir, `${name}.cls-meta.xml`);

      if (fs.existsSync(classFilePath)) {
        logger.error(`Batch class already exists: ${classFilePath}`);
        process.exit(1);
      }

      // Ensure directory exists
      fs.mkdirSync(targetDir, { recursive: true });

      const apiVersion = sfdxInfo.apiVersion;

      // 1. Generate Batchable Apex class
      const classContent = `public with sharing class ${name} implements Database.Batchable<sObject> {
    public Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id
            FROM ${sobject}
        ]);
    }

    public void execute(Database.BatchableContext context, List<${sobject}> scope) {
        // 🧦 Process each batch of records
    }

    public void finish(Database.BatchableContext context) {
        // 🧦 Clean up or post-batch operations
    }
}
`;
      fs.writeFileSync(classFilePath, classContent, "utf-8");
      fs.writeFileSync(metaFilePath, generateApexClassMeta(apiVersion), "utf-8");

      logger.success(`Created Batch class '${pc.bold(name)}'`);

      // 2. Generate companion test class if requested
      if (options.withTest) {
        const testName = `${name}Test`;
        const testFilePath = path.join(targetDir, `${testName}.cls`);
        const testMetaFilePath = path.join(targetDir, `${testName}.cls-meta.xml`);

        if (fs.existsSync(testFilePath)) {
          logger.warn(`Test class already exists and was skipped: ${testFilePath}`);
        } else {
          const testContent = `@IsTest
private class ${testName} {
    @TestSetup
    static void makeData() {
        // 🧦 Hob test data setup
    }

    @IsTest
    static void testBatchExecution() {
        Test.startTest();
        Database.executeBatch(new ${name}());
        Test.stopTest();

        // Then verify batch execution results
        Assert.isTrue(true, 'Expected batch job to execute successfully');
    }
}
`;
          fs.writeFileSync(testFilePath, testContent, "utf-8");
          fs.writeFileSync(testMetaFilePath, generateApexClassMeta(apiVersion), "utf-8");
          logger.success(`Created companion test class '${pc.bold(testName)}'`);
        }
      }

      console.log();
      logger.elf("Hob's work here is done! Your Batch files are prepared:");
      console.log();
      console.log(`  ${pc.bold("Directory:")} ${pc.cyan(targetDir)}`);
      console.log(`  ${pc.bold("Class:")}     ${name}.cls`);
      console.log(`  ${pc.bold("SObject:")}   ${sobject}`);
      if (options.withTest) {
        console.log(`  ${pc.bold("Test:")}      ${name}Test.cls (with Database.executeBatch boilerplate)`);
      } else {
        console.log(`  ${pc.bold("Test:")}      ${pc.dim("None (use --with-test to include companion test)")}`);
      }
      console.log();
    });
}
