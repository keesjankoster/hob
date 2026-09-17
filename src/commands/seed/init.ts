import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { logger } from "../../utils/logger.js";
import { getSfdxProjectInfo } from "../../utils/sfdx.js";

interface SeedInitOptions {
  type?: "apex" | "json" | "both";
  outputDir?: string;
}

export function registerSeedInitCommand(seedCmd: Command): void {
  seedCmd
    .command("init")
    .description("Scaffold starter seed files (Apex seed script and/or JSON data plan)")
    .option(
      "-t, --type <type>",
      "Type of seed fixture to scaffold (apex, json, both)",
      "both"
    )
    .option("-d, --output-dir <dir>", "Base directory to save the files")
    .action(async (options: SeedInitOptions) => {
      logger.banner();

      const sfdxInfo = getSfdxProjectInfo();
      const projectRoot = sfdxInfo.projectRoot;
      const scaffoldType = (options.type || "both").toLowerCase();

      const createdFiles: string[] = [];

      // 1. Scaffold Apex seed script
      if (scaffoldType === "apex" || scaffoldType === "both") {
        const apexDir = options.outputDir
          ? path.resolve(process.cwd(), options.outputDir)
          : path.join(projectRoot, "scripts", "apex");
        fs.mkdirSync(apexDir, { recursive: true });

        const apexFilePath = path.join(apexDir, "seed.apex");
        if (!fs.existsSync(apexFilePath)) {
          const apexContent = `/**
 * 🧦 Hob Test Data Seeder
 * Executes anonymous Apex to seed realistic demo data into your scratch org.
 */
System.debug('🧦 Hob is planting test data seeds...');

// 1. Accounts
List<Account> accounts = new List<Account>{
    new Account(Name = 'Acme Corp', BillingCity = 'San Francisco', BillingCountry = 'USA'),
    new Account(Name = 'Global Media Ltd', BillingCity = 'London', BillingCountry = 'UK')
};
insert accounts;

// 2. Contacts
List<Contact> contacts = new List<Contact>{
    new Contact(FirstName = 'Wile E.', LastName = 'Coyote', Email = 'coyote@acme.com', AccountId = accounts[0].Id),
    new Contact(FirstName = 'Arthur', LastName = 'Dent', Email = 'arthur@globalmedia.co.uk', AccountId = accounts[1].Id)
};
insert contacts;

System.debug('✔ Sown ' + accounts.size() + ' Accounts and ' + contacts.size() + ' Contacts!');
`;
          fs.writeFileSync(apexFilePath, apexContent, "utf-8");
          createdFiles.push(path.relative(projectRoot, apexFilePath));
        } else {
          logger.warn(`Apex seed script already exists: ${apexFilePath}`);
        }
      }

      // 2. Scaffold JSON data plan
      if (scaffoldType === "json" || scaffoldType === "both") {
        const dataDir = options.outputDir
          ? path.resolve(process.cwd(), options.outputDir)
          : path.join(projectRoot, "data");
        fs.mkdirSync(dataDir, { recursive: true });

        const planFilePath = path.join(dataDir, "data-plan.json");
        const accountsFilePath = path.join(dataDir, "Accounts.json");
        const contactsFilePath = path.join(dataDir, "Contacts.json");

        if (!fs.existsSync(planFilePath)) {
          const planContent = JSON.stringify(
            [
              {
                sobject: "Account",
                saveRefs: true,
                resolveRefs: false,
                files: ["Accounts.json"]
              },
              {
                sobject: "Contact",
                saveRefs: false,
                resolveRefs: true,
                files: ["Contacts.json"]
              }
            ],
            null,
            2
          );
          fs.writeFileSync(planFilePath, planContent, "utf-8");
          createdFiles.push(path.relative(projectRoot, planFilePath));
        }

        if (!fs.existsSync(accountsFilePath)) {
          const accountsContent = JSON.stringify(
            {
              records: [
                {
                  attributes: { type: "Account", referenceId: "AccountRef1" },
                  Name: "Acme Innovations",
                  BillingCity: "San Francisco",
                  BillingCountry: "USA"
                },
                {
                  attributes: { type: "Account", referenceId: "AccountRef2" },
                  Name: "Pinnacle Technologies",
                  BillingCity: "New York",
                  BillingCountry: "USA"
                }
              ]
            },
            null,
            2
          );
          fs.writeFileSync(accountsFilePath, accountsContent, "utf-8");
          createdFiles.push(path.relative(projectRoot, accountsFilePath));
        }

        if (!fs.existsSync(contactsFilePath)) {
          const contactsContent = JSON.stringify(
            {
              records: [
                {
                  attributes: { type: "Contact", referenceId: "ContactRef1" },
                  FirstName: "Jane",
                  LastName: "Doe",
                  Email: "jane.doe@acme.com",
                  AccountId: "@AccountRef1"
                },
                {
                  attributes: { type: "Contact", referenceId: "ContactRef2" },
                  FirstName: "John",
                  LastName: "Smith",
                  Email: "john.smith@pinnacle.com",
                  AccountId: "@AccountRef2"
                }
              ]
            },
            null,
            2
          );
          fs.writeFileSync(contactsFilePath, contactsContent, "utf-8");
          createdFiles.push(path.relative(projectRoot, contactsFilePath));
        }
      }

      console.log();
      if (createdFiles.length > 0) {
        logger.success(`Scaffolded ${createdFiles.length} starter test data fixture(s):`);
        console.log();
        for (const file of createdFiles) {
          console.log(`  • ${pc.cyan(file)}`);
        }
      } else {
        logger.info("Starter seed files were already present in project.");
      }

      console.log();
      logger.elf("Hob prepared your test fixtures! Seed them into any org with:");
      console.log(`  ${pc.cyan("hob seed")}`);
      console.log();
    });
}
