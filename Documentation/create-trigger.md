# 🎯 Scaffolding Triggers & Handlers

[← Back to Documentation](README.md)

Generate both an Apex trigger and a corresponding `TriggerHandler` class following clean Separation of Concerns:

```bash
hob create trigger <sobject> [options]
```

---

## 📖 Description

Writing triggers with logic embedded directly inside them is an anti-pattern. Hob generates both the trigger and a handler class that delegates each event (`before insert`, `after update`, etc.) to distinct methods.

- **Trigger (`<SObject>Trigger.trigger`)**: Delegates trigger events to the handler via `Trigger.operationType`.
- **Handler (`<SObject>TriggerHandler.cls`)**: Dispatches using a clean `switch on operationType` statement into type-safe methods (`onBeforeInsert(newList)`, `onAfterUpdate(newList, oldMap)`, etc.).

---

## 💡 Examples

```bash
# Standard object trigger & handler
hob create trigger Account
# Generates AccountTrigger.trigger and AccountTriggerHandler.cls

# Custom object trigger & handler
hob create trigger Invoice__c
# Generates InvoiceTrigger.trigger and InvoiceTriggerHandler.cls
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `-n, --name <name>` | `-n` | `<SObject>Trigger` | Override the trigger name |
| `--trigger-dir <dir>` | | `force-app/main/default/triggers` | Directory for saving the created trigger |
| `--class-dir <dir>` | | `force-app/main/default/classes` | Directory for saving the created handler class |
| `--help` | `-h` | | Display help for the command |
