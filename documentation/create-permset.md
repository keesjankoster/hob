# 🛡️ Scaffolding Permission Sets

[← Back to Documentation](README.md)

Scaffold a Salesforce Permission Set `.permissionset-meta.xml` file with optional object and Apex class access:

```bash
hob create permset <name> [options]
# Alias:
hob create permission-set <name> [options]
```

---

## 📖 Description

Permission sets grant developers and users fine-grained access to objects, fields, and Apex classes.

Hob scaffolds clean permission set XML metadata and can automatically populate boilerplate for:
- Object CRUD permissions (`<objectPermissions>`).
- Apex class execution access (`<classAccesses>`).
- Specific user licenses.

---

## 💡 Examples

```bash
# Basic permission set
hob create permset Billing_Admin

# With description and user license
hob create permset Sales_User -d "Standard sales representative permissions" --license Salesforce

# With pre-populated object CRUD permissions
hob create permset Property_Manager --objects "Property__c,Account,Contact"

# With pre-populated Apex class accesses
hob create permset Integration_User --classes "BillingService,PaymentWebhook"

# Combined objects and classes
hob create permset Super_User --objects Property__c --classes "PropertyController,PropertyService"
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `<name>` | | *(required)* | Developer/API name of the permission set |
| `-l, --label <label>` | `-l` | Derived title-case | UI label for the permission set |
| `-d, --description <desc>` | `-d` | | Description of permissions granted |
| `--license <license>` | | | User license API name (e.g. `Salesforce`) |
| `--objects <objects...>` | | | sObjects to pre-populate with CRUD permissions |
| `--classes <classes...>` | | | Apex classes to pre-populate with execution permissions |
| `-o, --output-dir <dir>` | `-o` | `.../default/permissionsets` | Output directory |
| `--help` | `-h` | | Display help for the command |
