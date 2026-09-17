# 📚 Hob Documentation

Welcome to the documentation for **Hob: The Salesforce House-Elf** 🧦.

Hob provides handy shortcuts to Salesforce CLI (`sf`) and Git commands to free you from repetitive development chores.

---

## 🛠️ Usage & Commands

Explore the documentation for each command:

| Command                        | Description                                                 | Documentation                                            |
| :----------------------------- | :---------------------------------------------------------- | :------------------------------------------------------- |
| `hob create project <name>`    | Scaffold a new SFDX project with manifest and git setup     | [🪄 Scaffolding Projects](create-project.md)             |
| `hob create lwc <name>`        | Generate an LWC bundle with automated `js-meta.xml` targets | [⚡ Scaffolding Lightning Web Components](create-lwc.md) |
| `hob create apex <name>`       | Create an Apex class with optional companion test class     | [🧪 Scaffolding Apex Classes](create-apex.md)            |
| `hob create trigger <sobject>` | Create a trigger and separation-of-concerns handler class   | [🎯 Scaffolding Triggers & Handlers](create-trigger.md)  |
| `hob create queueable <name>`  | Scaffold a Queueable Apex class with optional test class    | [⚡ Scaffolding Queueable Apex](create-queueable.md)     |
| `hob create batch <name>`      | Scaffold a Batchable Apex class with optional test class    | [🔄 Scaffolding Batch Apex](create-batch.md)             |
| `hob create object <name>`     | Scaffold a Custom Object bundle, fields dir, and metadata   | [📦 Scaffolding Custom Objects](create-object.md)        |
| `hob create field <obj> <name>`| Scaffold a Custom Field with type-specific XML metadata     | [🏷️ Scaffolding Custom Fields](create-field.md)         |
| `hob create permset <name>`    | Scaffold a Permission Set with object & class permissions   | [🛡️ Scaffolding Permission Sets](create-permset.md)     |
| `hob create cmdt <name>`       | Scaffold a Custom Metadata Type & starter record            | [⚙️ Scaffolding Custom Metadata Types](create-cmdt.md)   |
| `hob hearth [alias]`           | Light, inspect, or sweep the hearth (Dev Hub management)    | [🕯️ The Hearth (Dev Hub)](hearth.md)                    |
| `hob scratch new [alias]`      | Full setup pipeline for scratch orgs (create, push, seed)   | [⚡ Scratch Orgs (Lifecycle & Purge)](scratch.md)        |
| `hob scratch purge`            | Delete expired/active scratch orgs and keep Dev Hub clean   | [⚡ Scratch Orgs (Lifecycle & Purge)](scratch.md)        |
| `hob test [class]`             | Run unit tests with formatted summaries & coverage bars     | [🧪 Running Apex Tests & Coverage](test.md)              |

---

[← Back to Main README](../README.md)
