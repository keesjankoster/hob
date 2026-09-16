import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import { registerCreateCommand } from "./commands/create/index.js";
import { registerHearthCommand } from "./commands/hearth.js";

// Read version safely from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let version = "0.1.0";
try {
  const pkgPath = path.resolve(__dirname, "../package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    version = pkg.version || version;
  }
} catch {
  // Fallback version
}

const program = new Command();

program
  .name("hob")
  .description("🧙‍♂️ Hob: The Salesforce House-Elf 🧦\nQuiet, loyal assistance for your Salesforce & Git workflows")
  .version(version, "-v, --version", "Output the current version of Hob");

// Register commands
registerCreateCommand(program);
registerHearthCommand(program);

// Handle unknown commands gracefully
program.on("command:*", (operands) => {
  console.error(`\n✖ Unknown command: ${operands.join(" ")}`);
  console.error("Run 'hob --help' for a list of available commands.\n");
  process.exit(1);
});

export async function run(): Promise<void> {
  await program.parseAsync(process.argv);
}

run().catch((err) => {
  console.error("\n✖ Unexpected error:", err);
  process.exit(1);
});
