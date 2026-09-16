import { Command } from "commander";
import { registerCreateProjectCommand } from "./project.js";
import { registerCreateLwcCommand } from "./lwc.js";
import { registerCreateApexCommand } from "./apex.js";
import { registerCreateTriggerCommand } from "./trigger.js";
import { registerCreateQueueableCommand } from "./queueable.js";
import { registerCreateBatchCommand } from "./batch.js";

export function registerCreateCommand(program: Command): void {
  const createCmd = program
    .command("create")
    .description("Scaffold new Salesforce resources and projects");

  registerCreateProjectCommand(createCmd);
  registerCreateLwcCommand(createCmd);
  registerCreateApexCommand(createCmd);
  registerCreateTriggerCommand(createCmd);
  registerCreateQueueableCommand(createCmd);
  registerCreateBatchCommand(createCmd);
}

