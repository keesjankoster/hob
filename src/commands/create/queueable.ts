import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import { toPascalCase } from "../../utils/strings.js";
import { generateApexClassMeta } from "../../utils/xml.js";

interface CreateQueueableOptions {
  withTest?: boolean;
  outputDir?: string;
}

export function registerCreateQueueableCommand(parentCommand: Command): void {
  parentCommand
    .command("queueable <name>")
    .aliases(["queue"])
    .description("Scaffold a Queueable Apex class with optional companion test class")
    .option("--with-test", "Scaffold companion test class pre-populated with System.enqueueJob boilerplate")
    .option("-d, --output-dir <dir>", "Directory for saving the created class")
    .action(async (rawName: string, options: CreateQueueableOptions) => {
      logger.banner();

      const name = toPascalCase(rawName);
      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.classes;

      const classFilePath = path.join(targetDir, `${name}.cls`);
      const metaFilePath = path.join(targetDir, `${name}.cls-meta.xml`);

      if (fs.existsSync(classFilePath)) {
        logger.error(`Queueable class already exists: ${classFilePath}`);
        process.exit(1);
      }

      // Ensure directory exists
      fs.mkdirSync(targetDir, { recursive: true });

      const apiVersion = sfdxInfo.apiVersion;

      // 1. Generate Queueable Apex class
      const classContent = `public with sharing class ${name} implements Queueable {
    public ${name}() {
        // 🧦 House-Elf constructor
    }

    public void execute(QueueableContext context) {
        // 🧦 Asynchronous Queueable logic goes here
    }
}
`;
      fs.writeFileSync(classFilePath, classContent, "utf-8");
      fs.writeFileSync(metaFilePath, generateApexClassMeta(apiVersion), "utf-8");

      logger.success(`Created Queueable class '${pc.bold(name)}'`);

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
    static void testQueueableExecution() {
        Test.startTest();
        System.enqueueJob(new ${name}());
        Test.stopTest();

        // Then verify the async processing results
        Assert.isTrue(true, 'Expected queueable job to execute successfully');
    }
}
`;
          fs.writeFileSync(testFilePath, testContent, "utf-8");
          fs.writeFileSync(testMetaFilePath, generateApexClassMeta(apiVersion), "utf-8");
          logger.success(`Created companion test class '${pc.bold(testName)}'`);
        }
      }

      console.log();
      logger.elf("Hob's work here is done! Your Queueable files are prepared:");
      console.log();
      console.log(`  ${pc.bold("Directory:")} ${pc.cyan(targetDir)}`);
      console.log(`  ${pc.bold("Class:")}     ${name}.cls`);
      if (options.withTest) {
        console.log(`  ${pc.bold("Test:")}      ${name}Test.cls (with System.enqueueJob boilerplate)`);
      } else {
        console.log(`  ${pc.bold("Test:")}      ${pc.dim("None (use --with-test to include companion test)")}`);
      }
      console.log();
    });
}
