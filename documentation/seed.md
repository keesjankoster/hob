# 🌱 Test Data Seeding & Scratch Org Plans

[← Back to Documentation](README.md)

Import, export, and initialize lightweight scratch org data plans (`.json`) and Apex seed scripts (`.apex`):

```bash
hob seed [file] [options]
hob seed export [options]
hob seed init [options]
```

---

## 📖 Description

Scratch orgs start completely empty. To develop or test features, developers need consistent test data without having to manually create records through the UI every time a scratch org is kindled.

**Hob Seed** provides a unified data seeding workflow:
- **`hob seed [file]`**: Automatically discovers and imports data plans (`data/data-plan.json`) or runs anonymous Apex seed scripts (`scripts/apex/seed.apex`).
- **`hob seed export`**: Extracts records from an existing org (production, sandbox, or a configured scratch org) into lightweight sObject JSON tree plans.
- **`hob seed init`**: Generates starter seed files with realistic sample records so your team can seed scratch orgs immediately.

---

## 💡 Examples

### Importing / Seeding Data

```bash
# Auto-discovers and imports data/data-plan.json or scripts/apex/seed.apex
hob seed

# Import a specific JSON data plan
hob seed data/data-plan.json

# Run a specific Apex seed script
hob seed scripts/apex/seed.apex

# Seed into a specific scratch org or sandbox
hob seed -o my-scratch

# Import direct JSON data files
hob seed -f data/Accounts.json,data/Contacts.json
```

### Exporting Lightweight Data Plans

```bash
# Export using a SOQL query into data/ with an aggregated plan
hob seed export -q "SELECT Id, Name, (SELECT Id, FirstName, LastName, Email FROM Contacts) FROM Account LIMIT 25"

# Shortcut: Export key standard objects
hob seed export -s "Account,Contact"

# Export from a specific org with custom prefix and directory
hob seed export -q "SELECT Id, Name FROM Property__c" -d data/properties -x prop -o source-org
```

### Scaffolding Starter Seed Files

```bash
# Scaffold both Apex seed script (scripts/apex/seed.apex) and JSON data plan (data/data-plan.json)
hob seed init

# Scaffold only Apex script
hob seed init -t apex

# Scaffold only JSON plan
hob seed init -t json
```

---

## ⚙️ Options

### `hob seed [file]`

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `[file]` | | Auto-discovered | Path to seed file (`.json` plan or `.apex` script) |
| `-o, --target-org <org>` | `-o` | Default org | Target org username or alias |
| `-p, --plan <plan>` | `-p` | | Plan definition file to insert |
| `-f, --files <files...>` | `-f` | | Comma-separated JSON files to insert |
| `--apex <script>` | | | Apex seed script to execute |
| `--help` | `-h` | | Display help for the command |

### `hob seed export`

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `-q, --query <soql...>` | `-q` | | SOQL query or queries to export |
| `-s, --sobjects <objects...>` | `-s` | | Shortcut to export sample records from listed sObjects |
| `-d, --output-dir <dir>` | `-d` | `data` | Directory to store exported JSON files |
| `-x, --prefix <prefix>` | `-x` | `seed` | Prefix for generated JSON files |
| `-p, --plan` | `-p` | `true` | Generate an aggregated plan definition file |
| `--no-plan` | | | Do not generate a plan definition file |
| `-o, --target-org <org>` | `-o` | Default org | Source org username or alias |
| `--help` | `-h` | | Display help for the command |

### `hob seed init`

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `-t, --type <type>` | `-t` | `both` | Fixture type to scaffold (`apex`, `json`, `both`) |
| `-d, --output-dir <dir>` | `-d` | Project roots | Custom base directory for output files |
| `--help` | `-h` | | Display help for the command |
