# 📦 Scaffolding Custom Objects

[← Back to Documentation](README.md)

Scaffold a Salesforce Custom Object directory, `fields/` subdirectory, and `.object-meta.xml` metadata:

```bash
hob create object <name> [options]
```

---

## 📖 Description

Creating a Custom Object by hand requires creating an object directory, a `fields/` folder, and an XML file configuring labels, plural labels, deployment status, sharing models, and the record name field.

Hob does this instantly:
- Automatically appends `__c` to the API name if omitted.
- Intelligently derives singular and plural labels (e.g. `Property` -> `Properties`, `Expense` -> `Expenses`).
- Sets up standard `nameField` (Text or AutoNumber).
- Creates the `fields/` subdirectory ready for custom fields.

---

## 💡 Examples

```bash
# Basic custom object (creates Property__c with Text Name field)
hob create object Property

# With custom labels and description
hob create object Expense -l "Expense Report" -p "Expense Reports" -d "Tracks employee business expenses"

# AutoNumber Name field
hob create object Job_Application --name-field-type AutoNumber --auto-number-format "APP-{0000}"

# Private sharing model
hob create object Salary_Record --sharing-model Private
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `<name>` | | *(required)* | Developer/API name of the custom object (e.g. `Property`, `Expense__c`) |
| `-l, --label <label>` | `-l` | Derived title-case | Singular label for the custom object |
| `-p, --plural-label <plural>` | `-p` | Smart plural | Plural label for the custom object |
| `--name-field-type <type>` | | `Text` | Record name field type (`Text` or `AutoNumber`) |
| `--name-field-label <label>` | | `<Label> Name` | UI label for the record name field |
| `--auto-number-format <format>`| | `<NAME>-{0000}` | Display format mask for AutoNumber |
| `-d, --description <desc>` | `-d` | | Description of the custom object |
| `--sharing-model <model>` | | `ReadWrite` | Sharing model (`ReadWrite`, `Private`, `Read`) |
| `-o, --output-dir <dir>` | `-o` | `.../default/objects` | Output directory for the object bundle |
| `--help` | `-h` | | Display help for the command |
