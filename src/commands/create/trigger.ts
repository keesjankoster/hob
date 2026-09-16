import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import { normalizeSObjectName, deriveBaseName } from "../../utils/strings.js";
import { generateApexClassMeta, generateApexTriggerMeta } from "../../utils/xml.js";

interface CreateTriggerOptions {
  name?: string;
  triggerDir?: string;
  classDir?: string;
}

export function registerCreateTriggerCommand(parentCommand: Command): void {
  parentCommand
    .command("trigger")
    .description("Generate an Apex trigger and corresponding TriggerHandler with separation of concerns")
    .argument("<sobject>", "Salesforce Object name (e.g. 'Account', 'Contact', 'Invoice__c')")
    .option("-n, --name <name>", "Override the trigger name (default: <SObject>Trigger)")
    .option("--trigger-dir <dir>", "Directory for saving the created trigger")
    .option("--class-dir <dir>", "Directory for saving the created handler class")
    .action(async (rawSObject: string, options: CreateTriggerOptions) => {
      logger.banner();

      const sobject = normalizeSObjectName(rawSObject);
      const baseName = deriveBaseName(sobject);
      const triggerName = options.name || `${baseName}Trigger`;
      const handlerName = `${baseName}TriggerHandler`;

      const sfdxInfo = getSfdxProjectInfo();
      const triggerTargetDir = options.triggerDir
        ? path.resolve(process.cwd(), options.triggerDir)
        : sfdxInfo.paths.triggers;

      const classTargetDir = options.classDir
        ? path.resolve(process.cwd(), options.classDir)
        : sfdxInfo.paths.classes;

      const triggerFile = path.join(triggerTargetDir, `${triggerName}.trigger`);
      const triggerMetaFile = path.join(triggerTargetDir, `${triggerName}.trigger-meta.xml`);
      const handlerFile = path.join(classTargetDir, `${handlerName}.cls`);
      const handlerMetaFile = path.join(classTargetDir, `${handlerName}.cls-meta.xml`);

      if (fs.existsSync(triggerFile)) {
        logger.error(`Apex trigger already exists: ${triggerFile}`);
        process.exit(1);
      }

      if (fs.existsSync(handlerFile)) {
        logger.error(`TriggerHandler class already exists: ${handlerFile}`);
        process.exit(1);
      }

      // Ensure directories exist
      fs.mkdirSync(triggerTargetDir, { recursive: true });
      fs.mkdirSync(classTargetDir, { recursive: true });

      const apiVersion = sfdxInfo.apiVersion;

      // 1. Generate Trigger
      const triggerContent = `trigger ${triggerName} on ${sobject} (
    before insert,
    before update,
    before delete,
    after insert,
    after update,
    after delete,
    after undelete
) {
    ${handlerName}.handleTrigger(
        Trigger.operationType,
        Trigger.new,
        Trigger.oldMap
    );
}
`;

      fs.writeFileSync(triggerFile, triggerContent, "utf-8");
      fs.writeFileSync(triggerMetaFile, generateApexTriggerMeta(apiVersion), "utf-8");
      logger.success(`Created Apex trigger '${pc.bold(triggerName)}'`);

      // 2. Generate TriggerHandler class
      const handlerContent = `public with sharing class ${handlerName} {
    public static void handleTrigger(
        System.TriggerOperation operationType,
        List<${sobject}> newList,
        Map<Id, ${sobject}> oldMap
    ) {
        switch on operationType {
            when BEFORE_INSERT {
                onBeforeInsert(newList);
            }
            when AFTER_INSERT {
                onAfterInsert(newList);
            }
            when BEFORE_UPDATE {
                onBeforeUpdate(newList, oldMap);
            }
            when AFTER_UPDATE {
                onAfterUpdate(newList, oldMap);
            }
            when BEFORE_DELETE {
                onBeforeDelete(oldMap);
            }
            when AFTER_DELETE {
                onAfterDelete(oldMap);
            }
            when AFTER_UNDELETE {
                onAfterUndelete(newList);
            }
        }
    }

    private static void onBeforeInsert(List<${sobject}> newList) {
        // 🧦 Logic before records are inserted
    }

    private static void onAfterInsert(List<${sobject}> newList) {
        // 🧦 Logic after records are inserted
    }

    private static void onBeforeUpdate(List<${sobject}> newList, Map<Id, ${sobject}> oldMap) {
        // 🧦 Logic before records are updated
    }

    private static void onAfterUpdate(List<${sobject}> newList, Map<Id, ${sobject}> oldMap) {
        // 🧦 Logic after records are updated
    }

    private static void onBeforeDelete(Map<Id, ${sobject}> oldMap) {
        // 🧦 Logic before records are deleted
    }

    private static void onAfterDelete(Map<Id, ${sobject}> oldMap) {
        // 🧦 Logic after records are deleted
    }

    private static void onAfterUndelete(List<${sobject}> newList) {
        // 🧦 Logic after records are undeleted
    }
}
`;

      fs.writeFileSync(handlerFile, handlerContent, "utf-8");
      fs.writeFileSync(handlerMetaFile, generateApexClassMeta(apiVersion), "utf-8");
      logger.success(`Created TriggerHandler class '${pc.bold(handlerName)}'`);

      console.log();
      logger.elf("Hob prepared your trigger and handler with clean Separation of Concerns:");
      console.log();
      console.log(`  ${pc.bold("Trigger:")} ${pc.cyan(triggerFile)}`);
      console.log(`  ${pc.bold("Handler:")} ${pc.cyan(handlerFile)}`);
      console.log(`  ${pc.bold("SObject:")} ${sobject}`);
      console.log();
    });
}
