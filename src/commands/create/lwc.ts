import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";
import { toPascalCase, toTitleCase, isValidLwcName } from "../../utils/strings.js";
import { generateLwcBundleMeta } from "../../utils/xml.js";

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
  target?: string | string[];
  outputDir?: string;
  description?: string;
  masterLabel?: string;
}

function resolveTargets(rawTargets?: string | string[]): string[] {
  if (!rawTargets) return [];

  const inputs = Array.isArray(rawTargets) ? rawTargets : [rawTargets];
  const parsedTargets = inputs
    .flatMap((t) => t.split(/[,\s]+/))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const resolved = new Set<string>();

  for (const t of parsedTargets) {
    if (TARGET_MAP[t]) {
      resolved.add(TARGET_MAP[t]);
    } else if (t.startsWith("lightning__") || t.startsWith("lightningCommunity__")) {
      resolved.add(t);
    } else {
      logger.warn(`Unknown LWC target '${t}'. Valid shortcuts: ${Object.keys(TARGET_MAP).join(", ")}`);
    }
  }

  return Array.from(resolved);
}

export function registerCreateLwcCommand(parentCommand: Command): void {
  parentCommand
    .command("lwc")
    .description("Scaffold a Lightning Web Component with automated js-meta.xml targets")
    .argument("<name>", "Name of the component bundle (camelCase)")
    .option(
      "-t, --target <targets...>",
      "Target surfaces (record, app, home, flow, tab, quickaction, community, inbox)"
    )
    .option("-d, --output-dir <dir>", "Directory for saving the created component")
    .option("--description <desc>", "Component description")
    .option("--master-label <label>", "Master label for the component")
    .action(async (name: string, options: CreateLwcOptions) => {
      logger.banner();

      if (!isValidLwcName(name)) {
        logger.error(
          `Invalid LWC component name '${name}'. Must start with a letter and contain only alphanumeric characters with no spaces, underscores, or path separators (e.g. accountCard, propertyTile).`
        );
        process.exit(1);
      }

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

      // 3. Generate js-meta.xml file using shared XML generator
      const metaXmlContent = generateLwcBundleMeta({
        apiVersion,
        isExposed,
        masterLabel,
        description,
        targets
      });
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
