import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import { toPascalCase } from "../../utils/strings.js";
import { generateApexClassMeta } from "../../utils/xml.js";

interface CreateApexOptions {
  withTest?: boolean;
  outputDir?: string;
}

export function registerCreateApexCommand(parentCommand: Command): void {
  parentCommand
    .command("apex")
    .description("Scaffold an Apex class with an optional companion test class")
    .argument("<name>", "Name of the Apex class (PascalCase)")
    .option("--with-test", "Scaffold companion test class pre-populated with @IsTest, @TestSetup, and assertions")
    .option("-d, --output-dir <dir>", "Directory for saving the created class")
    .action(async (rawName: string, options: CreateApexOptions) => {
      logger.banner();

      const name = toPascalCase(rawName);
      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.classes;

      const classFilePath = path.join(targetDir, `${name}.cls`);
      const metaFilePath = path.join(targetDir, `${name}.cls-meta.xml`);

      if (fs.existsSync(classFilePath)) {
        logger.error(`Apex class file already exists: ${classFilePath}`);
        process.exit(1);
      }

      // Ensure directory exists
      fs.mkdirSync(targetDir, { recursive: true });

      const apiVersion = sfdxInfo.apiVersion;

      // 1. Write main Apex class
      const classContent = `public with sharing class ${name} {
    public ${name}() {
        // 🧦 House-Elf constructor
    }
}
`;
      fs.writeFileSync(classFilePath, classContent, "utf-8");
      fs.writeFileSync(metaFilePath, generateApexClassMeta(apiVersion), "utf-8");

      logger.success(`Created Apex class '${pc.bold(name)}'`);

      // 2. Write companion test class if requested
      const testFilesCreated: string[] = [];
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
    static void testPositiveBehavior() {
        Test.startTest();
        // When
        Test.stopTest();

        // Then
        Assert.isNotNull(true, 'Expected value to not be null');
    }

    @IsTest
    static void testNegativeBehavior() {
        Test.startTest();
        // When
        Test.stopTest();

        // Then
        Assert.isTrue(true, 'Expected condition to be true');
    }
}
`;
          fs.writeFileSync(testFilePath, testContent, "utf-8");
          fs.writeFileSync(testMetaFilePath, generateApexClassMeta(apiVersion), "utf-8");
          testFilesCreated.push(`${testName}.cls`);
          logger.success(`Created companion test class '${pc.bold(testName)}'`);
        }
      }

      console.log();
      logger.elf("Hob's work here is done! Your Apex files are prepared:");
      console.log();
      console.log(`  ${pc.bold("Directory:")} ${pc.cyan(targetDir)}`);
      console.log(`  ${pc.bold("Class:")}     ${name}.cls`);
      if (options.withTest) {
        console.log(`  ${pc.bold("Test:")}      ${name}Test.cls (with @TestSetup & Assert boilerplate)`);
      } else {
        console.log(`  ${pc.bold("Test:")}      ${pc.dim("None (use --with-test to include companion test)")}`);
      }
      console.log();
    });
}
