# ⚡ Scaffolding Queueable Apex

[← Back to Documentation](README.md)

Scaffold a Queueable Apex class with an optional companion test class pre-populated with `System.enqueueJob` boilerplate:

```bash
hob create queueable <name> [--with-test] [options]
```

*Aliases: `hob create quable <name>`, `hob create queue <name>`*

---

## 📖 Description

Queueable Apex provides a powerful way to run asynchronous jobs with complex types and chaining capabilities. Hob scaffolds `<name>.cls` implementing the `Queueable` interface along with its `<name>.cls-meta.xml` metadata file.

When `--with-test` is provided, Hob also scaffolds `<name>Test.cls` pre-populated with `@IsTest`, `@TestSetup`, and the `Test.startTest()` / `System.enqueueJob(new <name>())` / `Test.stopTest()` execution pattern.

---

## 💡 Examples

```bash
# Generate standalone Queueable Apex class
hob create queueable ProcessOutboundPayments

# Generate Queueable class with companion test class
hob create queueable ProcessOutboundPayments --with-test

# Using the short alias
hob create queue SyncAccounts --with-test

# Specify custom output directory
hob create queueable HeavyCalculations -d ./async-classes
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--with-test` | | `false` | Scaffold companion test class with `System.enqueueJob` boilerplate |
| `--output-dir <dir>` | `-d` | `force-app/main/default/classes` | Directory for saving the created class |
| `--help` | `-h` | | Display help for the command |
