# 🧪 Scaffolding Apex Classes

[← Back to Documentation](README.md)

Create an Apex class with an optional companion test class pre-populated with `@IsTest`, `@TestSetup`, and modern `Assert.*` boilerplate:

```bash
hob create apex <name> [--with-test] [options]
```

---

## 📖 Description

Hob scaffolds both `<name>.cls` and `<name>.cls-meta.xml`, automatically setting the API version from your `sfdx-project.json`.

When the `--with-test` flag is passed, Hob also scaffolds `<name>Test.cls` and `<name>Test.cls-meta.xml`, pre-populated with:
- `@IsTest` annotation
- `@TestSetup static void makeData()` method for clean data setup
- Positive and negative test case templates
- Modern `Assert.isNotNull` and `Assert.isTrue` assertions

---

## 💡 Examples

```bash
# Generate standalone Apex class
hob create apex OrderService

# Generate Apex class with companion test class
hob create apex OrderService --with-test

# Generate in a specific directory
hob create apex OrderService --with-test -d ./classes
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--with-test` | | `false` | Scaffold companion test class with `@TestSetup` & `Assert.*` |
| `--output-dir <dir>` | `-d` | `force-app/main/default/classes` | Directory for saving the created class |
| `--help` | `-h` | | Display help for the command |
