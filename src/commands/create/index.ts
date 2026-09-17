import { Command } from "commander";
import { registerCreateProjectCommand } from "./project.js";
import { registerCreateLwcCommand } from "./lwc.js";
import { registerCreateApexCommand } from "./apex.js";
import { registerCreateTriggerCommand } from "./trigger.js";
import { registerCreateQueueableCommand } from "./queueable.js";
import { registerCreateBatchCommand } from "./batch.js";
import { registerCreateObjectCommand } from "./object.js";
import { registerCreateFieldCommand } from "./field.js";
import { registerCreatePermsetCommand } from "./permset.js";
import { registerCreateCmdtCommand } from "./cmdt.js";
import { registerCreateFactoryCommand } from "./factory.js";

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
  registerCreateObjectCommand(createCmd);
  registerCreateFieldCommand(createCmd);
  registerCreatePermsetCommand(createCmd);
  registerCreateCmdtCommand(createCmd);
  registerCreateFactoryCommand(createCmd);
}

