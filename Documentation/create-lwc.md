# ⚡ Scaffolding Lightning Web Components

[← Back to Documentation](README.md)

Generate a Lightning Web Component bundle with automatically populated `js-meta.xml` targets—no manual XML editing required:

```bash
hob create lwc <name> [--target record,app] [options]
```

---

## 📖 Description

Creating an LWC manually usually requires editing `<name>.js-meta.xml` to set `<isExposed>true</isExposed>` and typing out long target names like `<target>lightning__RecordPage</target>`. 

Hob takes care of this chore automatically when you pass the `--target` flag with convenient aliases.

---

## 💡 Examples

```bash
# Generate component targeting record pages and app pages
hob create lwc contactCard --target record,app

# Target home pages and flow screens
hob create lwc greetingBanner --target home,flow

# Specify custom output directory
hob create lwc customModal -d ./my-components
```

---

## 🎯 Target Shortcuts

Hob maps intuitive shorthand keywords to full Salesforce target identifiers:

| Shortcut | Salesforce Target | Description |
| :--- | :--- | :--- |
| `record` | `lightning__RecordPage` | Lightning Record Page |
| `app` | `lightning__AppPage` | Lightning App Page |
| `home` | `lightning__HomePage` | Lightning Home Page |
| `community` | `lightningCommunity__Page` | Experience Cloud Community Page |
| `flow` | `lightning__FlowScreen` | Screen Flow Screen Component |
| `tab` | `lightning__Tab` | Custom Tab Component |
| `quickaction` / `action` | `lightning__RecordAction` | Lightning Record Quick Action |
| `inbox` | `lightning__Inbox` | Outlook / Gmail Integration |

*Note: You can also supply raw full targets (e.g. `--target lightning__RecordPage`).*

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--target <targets>` | `-t` | — | Comma-separated target shortcuts (e.g. `record,app`) |
| `--output-dir <dir>` | `-d` | `force-app/main/default/lwc` | Directory for saving the created component |
| `--description <desc>` | | `<Name> Component` | Description for `js-meta.xml` |
| `--master-label <label>` | | Title Case of `<name>` | Master label in `js-meta.xml` |
| `--help` | `-h` | | Display help for the command |
