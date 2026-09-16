# 🔄 Scaffolding Batch Apex

[← Back to Documentation](README.md)

Scaffold a Batchable Apex class with `start`, `execute`, and `finish` methods, along with an optional companion test class pre-populated with `Database.executeBatch` boilerplate:

```bash
hob create batch <name> [--sobject <sobject>] [--with-test] [options]
```

*Alias: `hob create batchable <name>`*

---

## 📖 Description

Batch Apex allows you to process large record sets asynchronously. Hob scaffolds `<name>.cls` implementing `Database.Batchable<sObject>` with standard `start`, `execute`, and `finish` methods typed to your desired SObject.

When `--with-test` is provided, Hob generates `<name>Test.cls` pre-populated with `@IsTest`, `@TestSetup`, and the `Test.startTest()` / `Database.executeBatch(new <name>())` / `Test.stopTest()` testing pattern.

---

## 💡 Examples

```bash
# Generate Batch class for Account (default object)
hob create batch AccountReconciliation

# Generate Batch class for a specific standard object
hob create batch ContactCleanup -s Contact

# Generate Batch class for a custom object with companion test
hob create batch InvoiceArchiver --sobject Invoice__c --with-test

# Specify custom output directory
hob create batch DataSync -d ./batch-jobs
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `-s, --sobject <sobject>` | `-s` | `Account` | Target Salesforce object to batch over |
| `--with-test` | | `false` | Scaffold companion test class with `Database.executeBatch` boilerplate |
| `--output-dir <dir>` | `-d` | `force-app/main/default/classes` | Directory for saving the created class |
| `--help` | `-h` | | Display help for the command |
