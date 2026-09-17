# 🏷️ Scaffolding Custom Fields

[← Back to Documentation](README.md)

Scaffold a Salesforce Custom Field `.field-meta.xml` inside an object's `fields/` directory:

```bash
hob create field <object> <name> [options]
```

---

## 📖 Description

Adding fields to standard and custom objects in source format often requires writing verbose XML structures.

Hob supports **12+ field types**:
`Text`, `Number`, `Currency`, `Checkbox`, `Date`, `DateTime`, `Picklist`, `LongTextArea`, `Lookup`, `Percent`, `Email`, `Phone`, `Url`.

Hob automatically:
- Resolves the target object directory (supporting standard objects like `Account` and custom objects like `Property` or `Property__c`).
- Automatically appends `__c` to custom field API names.
- Pre-populates default constraints and XML structures tailored to the selected field type.

---

## 💡 Examples

```bash
# Text field (255 characters)
hob create field Property Address

# Currency field with scale and precision
hob create field Property Price -t Currency --precision 12 --scale 2

# Picklist with predefined values
hob create field Property Status -t Picklist --values "Available,Pending,Sold"

# Checkbox with default value
hob create field Property Is_Featured -t Checkbox --default-value true

# Lookup relationship (defaults to SetNull for optional lookup)
hob create field Property Account -t Lookup --reference-to Account

# Required Lookup relationship (automatically defaults to Restrict delete)
hob create field Appointment__c Customer -t Lookup --reference-to Contact -r

# Long Text Area
hob create field Property Description -t LongTextArea --length 4000

# Required field with help text
hob create field Property Listing_Date -t Date --required --help-text "Date the property was listed on MLS"
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `<object>` | | *(required)* | Target sObject API name (e.g. `Account`, `Property__c`, `Property`) |
| `<name>` | | *(required)* | API name of the field (e.g. `Price`, `Status__c`) |
| `-t, --type <type>` | `-t` | `Text` | Field type (`Text`, `Number`, `Currency`, `Checkbox`, `Date`, `DateTime`, `Picklist`, `LongTextArea`, `Lookup`, `Percent`, `Email`, `Phone`, `Url`) |
| `-l, --label <label>` | `-l` | Derived title-case | UI label for the field |
| `-d, --description <desc>` | `-d` | | Field description |
| `--help-text <text>` | | | Inline help text |
| `-r, --required` | `-r` | `false` | Mark field as required |
| `--unique` | | `false` | Enforce unique values |
| `--external-id` | | `false` | Mark as an external ID |
| `--length <length>` | | `255` / `32768` | Character length for Text or LongTextArea |
| `--precision <precision>` | | `18` | Precision for Number/Currency/Percent |
| `--scale <scale>` | | `2` | Decimal scale for Number/Currency/Percent |
| `--values <values...>` | | | Picklist values (space or comma separated) |
| `--reference-to <object>` | | `Account` | Target sObject for Lookup fields |
| `--relationship-name <name>` | | Plural object | Relationship name for Lookup fields |
| `--relationship-label <label>`| | Plural object | Relationship label for Lookup fields |
| `--delete-constraint <constraint>` | | `Restrict` / `SetNull` | Delete constraint for Lookup fields (`Restrict`, `SetNull`, `Cascade`). Defaults to `Restrict` if required, otherwise `SetNull`. |
| `--default-value <val>` | | `false` | Default value (e.g. `true` or `false` for Checkbox) |
| `-o, --output-dir <dir>` | `-o` | `.../default/objects` | Base objects directory |
| `--help` | `-h` | | Display help for the command |
