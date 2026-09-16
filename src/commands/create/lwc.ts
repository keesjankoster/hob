import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";

const TARGET_MAP: Record<string, string> = {
  record: "lightning__RecordPage",
  app: "lightning__AppPage",
  home: "lightning__HomePage",
  community: "lightningCommunity__Page",
  flow: "lightning__FlowScreen",
  tab: "lightning__Tab",
  quickaction: "lightning__RecordAction",
  action: "lightning__RecordAction",
  inbox: "lightning__Inbox"
};

interface CreateLwcOptions {
  target?: string;
  outputDir?: string;
  description?: string;
  masterLabel?: string;
}

function toPascalCase(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function resolveTargets(targetInput?: string): string[] {
  if (!targetInput) return [];

  const rawTargets = targetInput.split(",").map((t) => t.trim().toLowerCase());
  const resolvedTargets: string[] = [];

  for (const t of rawTargets) {
    if (!t) continue;
    if (TARGET_MAP[t]) {
      resolvedTargets.push(TARGET_MAP[t]);
    } else if (t.startsWith("lightning")) {
      // If user typed the full target name, preserve it
      resolvedTargets.push(t);
    } else {
      logger.warn(`Unknown target shortcut '${t}'. Known shortcuts: ${Object.keys(TARGET_MAP).join(", ")}`);
    }
  }

  // Deduplicate
  return [...new Set(resolvedTargets)];
}

export function registerCreateLwcCommand(parentCommand: Command): void {
  parentCommand
    .command("lwc")
    .description("Scaffold a Lightning Web Component with automated js-meta.xml targets")
    .argument("<name>", "Name of the Lightning Web Component (camelCase)")
    .option(
      "-t, --target <targets>",
      "Comma-separated targets (e.g. 'record,app', 'home', 'community', 'flow', 'tab')"
    )
    .option("-d, --output-dir <dir>", "Directory for saving the created component")
    .option("--description <desc>", "Component description")
    .option("--master-label <label>", "Master label for the component")
    .action(async (name: string, options: CreateLwcOptions) => {
      logger.banner();

      const sfdxInfo = getSfdxProjectInfo();
      const targetDir = options.outputDir
        ? path.resolve(process.cwd(), options.outputDir)
        : sfdxInfo.paths.lwc;

      const componentDir = path.join(targetDir, name);

      if (fs.existsSync(componentDir)) {
        logger.error(`LWC component directory already exists: ${componentDir}`);
        process.exit(1);
      }

      const targets = resolveTargets(options.target);
      const isExposed = targets.length > 0;
      const pascalName = toPascalCase(name);
      const masterLabel = options.masterLabel || toTitleCase(name);
      const description = options.description || `${masterLabel} Component`;
      const apiVersion = sfdxInfo.apiVersion;

      // Ensure destination directory exists
      fs.mkdirSync(componentDir, { recursive: true });

      // 1. Generate JavaScript file
      const jsContent = `import { LightningElement, api } from 'lwc';

export default class ${pascalName} extends LightningElement {
    // 🧦 House-Elf magic begins here
}
`;
      fs.writeFileSync(path.join(componentDir, `${name}.js`), jsContent, "utf-8");

      // 2. Generate HTML template file
      const htmlContent = `<template>
    <!-- ${name} component created by Hob 🧦 -->
</template>
`;
      fs.writeFileSync(path.join(componentDir, `${name}.html`), htmlContent, "utf-8");

      // 3. Generate js-meta.xml file
      let targetsXml = "";
      if (targets.length > 0) {
        targetsXml = `\n    <targets>\n${targets
          .map((target) => `        <target>${target}</target>`)
          .join("\n")}\n    </targets>`;
      }

      const metaXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <isExposed>${isExposed}</isExposed>
    <masterLabel>${masterLabel}</masterLabel>
    <description>${description}</description>${targetsXml}
</LightningComponentBundle>
`;
      fs.writeFileSync(path.join(componentDir, `${name}.js-meta.xml`), metaXmlContent, "utf-8");

      logger.success(`Created Lightning Web Component '${pc.bold(name)}'`);
      console.log();
      logger.elf("Hob populated your component and handled the js-meta.xml targets:");
      console.log();
      console.log(`  ${pc.bold("Directory:")}  ${pc.cyan(componentDir)}`);
      console.log(`  ${pc.bold("Exposed:")}    ${isExposed ? pc.green("true") : pc.dim("false")}`);
      if (targets.length > 0) {
        console.log(`  ${pc.bold("Targets:")}    ${pc.green(targets.join(", "))}`);
      } else {
        console.log(`  ${pc.bold("Targets:")}    ${pc.dim("None (pass --target record,app to populate)")}`);
      }
      console.log();
    });
}
