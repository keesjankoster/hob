import { Command } from "commander";
import { registerCreateProjectCommand } from "./project.js";

export function registerCreateCommand(program: Command): void {
  const createCmd = program
    .command("create")
    .description("Scaffold new Salesforce resources and projects");

  registerCreateProjectCommand(createCmd);
}
