# ⚙️ Scaffolding Custom Metadata Types (CMDT)

[← Back to Documentation](README.md)

Scaffold a Salesforce Custom Metadata Type (`__mdt.object-meta.xml`), its `fields/` subdirectory, and an optional initial record in `customMetadata/`:

```bash
hob create cmdt <name> [options]
# Alias:
hob create custom-metadata <name> [options]
```

---

## 📖 Description

Custom Metadata Types (commonly abbreviated as **CMDT**) let developers define custom application configurations that can be packaged and deployed across orgs without needing manual data loads.

Hob scaffolds:
- The `<name>__mdt` object directory and `fields/` subfolder.
- The `<name>__mdt.object-meta.xml` metadata descriptor.
- An optional initial record in `customMetadata/<name>.<recordName>.md-meta.xml` when `--with-record` is supplied.

Once created, custom fields can be added directly via `hob create field <name>__mdt <fieldName>`.

---

## 💡 Examples

```bash
# Scaffold Custom Metadata Type
hob create cmdt Discount_Rule

# With custom labels and description
hob create cmdt Tax_Config -l "Tax Configuration" -d "State and regional sales tax multipliers"

# Protected visibility (for managed packages)
hob create cmdt Internal_Secret --visibility Protected

# Scaffold with an initial starter record
hob create cmdt Feature_Flag --with-record Enable_New_Checkout

# Using the alias
hob create custom-metadata App_Setting --with-record Default
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `<name>` | | *(required)* | Developer/API name (e.g. `Discount_Rule`, `App_Config__mdt`) |
| `-l, --label <label>` | `-l` | Derived title-case | UI label for the metadata type |
| `-p, --plural-label <plural>` | `-p` | Smart plural | Plural label for the metadata type |
| `-d, --description <desc>` | `-d` | | Description of the metadata type |
| `--visibility <visibility>` | | `Public` | Visibility (`Public` or `Protected`) |
| `-r, --with-record [name]` | `-r` | | Scaffold initial record in `customMetadata/` (default: `Default`) |
| `-o, --output-dir <dir>` | `-o` | `.../default/objects` | Output directory for the object bundle |
| `--help` | `-h` | | Display help for the command |
