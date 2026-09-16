import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../../utils/logger.js";
import { commandExists, runCommand } from "../../utils/runner.js";

interface CreateProjectOptions {
  template: string;
  outputDir: string;
  defaultPackageDir: string;
  namespace?: string;
  manifest: boolean;
  git: boolean;
}

export function registerCreateProjectCommand(parentCommand: Command): void {
  parentCommand
    .command("project")
    .description("Create a new Salesforce DX project")
    .argument("<name>", "Name of the Salesforce DX project")
    .option("-t, --template <template>", "Template to use (standard, empty, analytics, etc.)", "standard")
    .option("-d, --output-dir <dir>", "Directory for saving the created project", ".")
    .option("-p, --default-package-dir <dir>", "Default package directory name", "force-app")
    .option("-s, --namespace <namespace>", "Namespace associated with this project")
    .option("--manifest", "Generate a manifest (package.xml)", true)
    .option("--no-manifest", "Do not generate a manifest (package.xml)")
    .option("--git", "Initialize a git repository and make initial commit", true)
    .option("--no-git", "Do not initialize a git repository")
    .action(async (name: string, options: CreateProjectOptions) => {
      logger.banner();

      const projectTargetDir = path.resolve(process.cwd(), options.outputDir, name);

      if (fs.existsSync(projectTargetDir)) {
        logger.error(`Target directory already exists: ${projectTargetDir}`);
        process.exit(1);
      }

      // Verify sf is installed
      const hasSf = await commandExists("sf");
      if (!hasSf) {
        logger.error("The Salesforce CLI ('sf') is not found in your PATH.");
        logger.info("Please install it via: npm install -g @salesforce/cli");
        process.exit(1);
      }

      // Step 1: Scaffold SFDX Project
      const totalSteps = options.git ? 2 : 1;
      let currentStep = 1;

      const sfSpinner = ora({
        text: `Hob is tidying up and generating Salesforce project '${name}'...`,
        color: "magenta"
      }).start();

      try {
        const sfArgs = [
          "template",
          "generate",
          "project",
          "--name",
          name,
          "--output-dir",
          options.outputDir,
          "--template",
          options.template,
          "--default-package-dir",
          options.defaultPackageDir
        ];

        if (options.manifest) {
          sfArgs.push("--manifest");
        }

        if (options.namespace) {
          sfArgs.push("--namespace", options.namespace);
        }

        await runCommand("sf", sfArgs);
        sfSpinner.succeed(pc.green(`Salesforce DX project '${pc.bold(name)}' generated.`));
      } catch (err: any) {
        sfSpinner.fail(pc.red(`Failed to generate Salesforce project '${name}'.`));
        logger.error(err.message);
        process.exit(1);
      }

      // Step 2: Initialize Git Repository
      if (options.git) {
        currentStep++;
        const gitSpinner = ora({
          text: "Hob is sweeping up a new git repository and crafting the initial commit...",
          color: "magenta"
        }).start();

        const hasGit = await commandExists("git");
        if (!hasGit) {
          gitSpinner.warn(pc.yellow("Git was not found in your PATH. Skipped git initialization."));
        } else {
          try {
            await runCommand("git", ["init"], { cwd: projectTargetDir });
            await runCommand("git", ["add", "."], { cwd: projectTargetDir });
            await runCommand(
              "git",
              ["commit", "-m", "chore: initial salesforce dx project setup by Hob 🧦"],
              { cwd: projectTargetDir }
            );
            gitSpinner.succeed(pc.green("Git repository initialized with initial commit."));
          } catch (err: any) {
            gitSpinner.warn(pc.yellow(`Git initialization encountered a warning: ${err.message}`));
          }
        }
      }

      // Summary
      console.log();
      logger.elf("Hob's work here is done! Your hearth is swept and your project is ready:");
      console.log();
      console.log(`  ${pc.bold("Location:")} ${pc.cyan(projectTargetDir)}`);
      console.log(`  ${pc.bold("Template:")} ${options.template}`);
      console.log(`  ${pc.bold("Manifest:")} ${options.manifest ? pc.green("yes (manifest/package.xml)") : pc.dim("no")}`);
      console.log(`  ${pc.bold("Git:")}      ${options.git ? pc.green("initialized") : pc.dim("skipped")}`);
      console.log();
      console.log(pc.bold("Next steps:"));
      console.log(`  ${pc.cyan(`cd ${options.outputDir === "." ? name : path.join(options.outputDir, name)}`)}`);
      console.log(`  ${pc.cyan("sf org login web")} ${pc.dim("(or authorize your target org)")}`);
      console.log();
    });
}
