import { Command } from "commander";
import { registerScratchNewCommand } from "./new.js";
import { registerScratchPurgeCommand } from "./purge.js";
import { registerScratchOpenCommand } from "./open.js";
import { registerScratchDeployCommand } from "./deploy.js";

export function registerScratchCommand(program: Command): void {
  const scratchCmd = program
    .command("scratch")
    .description("Manage temporary scratch orgs and development environments");

  registerScratchNewCommand(scratchCmd);
  registerScratchPurgeCommand(scratchCmd);
  registerScratchOpenCommand(scratchCmd);
  registerScratchDeployCommand(scratchCmd);
}

