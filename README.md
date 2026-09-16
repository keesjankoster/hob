<h1 align="center">🧙‍♂️ Hob: The Salesforce House-Elf 🧦</h1>

<p align="center">
  <em>"Loyal, quiet, and tireless assistance for your Salesforce Development."</em>
</p>

---

## 📖 Overview

In traditional folklore, a **Hob** is a friendly household spirit who works quietly in the dead of night—sweeping the hearth, tidying rooms, and grinding flour before anyone awakens.

**Hob the Salesforce House-Elf** brings that ancient magic to your Salesforce org. Operating quietly behind the scenes, Hob relieves developers of tedious, repetitive chores by providing intuitive shortcuts to Salesforce CLI (`sf`) and Git commands.

**Let Hob do the chores.**

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: >= 18.0.0
- **Salesforce CLI**: `sf` (`npm install -g @salesforce/cli`)
- **Git**: Installed and accessible in your PATH

### Installation & Local Setup

```bash
# Clone the repository
git clone https://github.com/keesjankoster/hob.git
cd hob

# Install dependencies and build
npm install
npm run build

# Link globally for direct 'hob' terminal usage
npm link
```

---

## 🛠️ Usage & Commands

### 🪄 Scaffolding Projects

Hob sweeps up the boilerplate, scaffolds your Salesforce DX project with a manifest, initializes Git, and makes your first commit:

```bash
hob create project <name>
```

#### Examples

```bash
# Basic project creation (with manifest and git initialized automatically)
hob create project my-org

# Create in a specific directory
hob create project my-org -d ./projects

# Use an empty template without git
hob create project bare-bones -t empty --no-git

# Skip generating a manifest (package.xml)
hob create project quick-poc --no-manifest
```

#### Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--template <template>` | `-t` | `standard` | Template to use (`standard`, `empty`, `analytics`, etc.) |
| `--output-dir <dir>` | `-d` | `.` | Directory for saving the created project |
| `--default-package-dir <dir>` | `-p` | `force-app` | Default package directory name |
| `--namespace <namespace>` | `-s` | — | Namespace associated with this project |
| `--manifest / --no-manifest` | | `true` | Generate a manifest (`manifest/package.xml`) |
| `--git / --no-git` | | `true` | Initialize a Git repo and make the initial commit |
| `--help` | `-h` | | Display help for the command |

---

### ⚡ Scaffolding Lightning Web Components

Generate an LWC bundle with automatically populated `js-meta.xml` targets—no manual XML editing required:

```bash
hob create lwc <name> [--target record,app]
```

#### Examples

```bash
# Generate component targeting record pages and app pages
hob create lwc contactCard --target record,app

# Target home pages and flow screens
hob create lwc greetingBanner --target home,flow

# Specify custom output directory
hob create lwc customModal -d ./my-components
```

#### Target Shortcuts

| Shortcut | Salesforce Target |
| :--- | :--- |
| `record` | `lightning__RecordPage` |
| `app` | `lightning__AppPage` |
| `home` | `lightning__HomePage` |
| `community` | `lightningCommunity__Page` |
| `flow` | `lightning__FlowScreen` |
| `tab` | `lightning__Tab` |
| `quickaction` / `action` | `lightning__RecordAction` |
| `inbox` | `lightning__Inbox` |

---

### 🧪 Scaffolding Apex Classes

Create an Apex class with an optional companion test class pre-populated with `@IsTest`, `@TestSetup`, and modern `Assert.*` boilerplate:

```bash
hob create apex <name> [--with-test]
```

#### Examples

```bash
# Generate standalone Apex class
hob create apex OrderService

# Generate Apex class with companion test class
hob create apex OrderService --with-test
```

---

### 🎯 Scaffolding Triggers & Handlers

Generate both an Apex trigger and a corresponding `TriggerHandler` class following clean Separation of Concerns:

```bash
hob create trigger <sobject>
```

#### Examples

```bash
# Standard object trigger & handler
hob create trigger Account
# Generates AccountTrigger.trigger and AccountTriggerHandler.cls

# Custom object trigger & handler
hob create trigger Invoice__c
# Generates InvoiceTrigger.trigger and InvoiceTriggerHandler.cls
```

The generated trigger automatically delegates to the handler using Salesforce's native `System.TriggerOperation` enum (`switch on Trigger.operationType`), providing dedicated methods for each trigger event (`onBeforeInsert`, `onAfterUpdate`, etc.).

---

## 📦 Scripts

- `npm run build`: Bundles the TypeScript CLI using `tsup` into `dist/`.
- `npm run dev`: Starts `tsup` in watch mode for development.
- `npm start`: Runs the CLI entrypoint locally (`node bin/hob.js`).
