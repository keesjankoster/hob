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

Detailed guides and flag references have been moved to the [**Documentation**](documentation/README.md) index:

- 🪄 [**Scaffolding Projects**](documentation/create-project.md) (`hob create project <name>`)
- ⚡ [**Scaffolding Lightning Web Components**](documentation/create-lwc.md) (`hob create lwc <name> [--target record,app]`)
- 🧪 [**Scaffolding Apex Classes**](documentation/create-apex.md) (`hob create apex <name> [--with-test]`)
- 🎯 [**Scaffolding Triggers & Handlers**](documentation/create-trigger.md) (`hob create trigger <sobject>`)
- ⚡ [**Scaffolding Queueable Apex**](documentation/create-queueable.md) (`hob create queueable <name> [--with-test]`)
- 🔄 [**Scaffolding Batch Apex**](documentation/create-batch.md) (`hob create batch <name> [--sobject <sobject>] [--with-test]`)
- 🕯️ [**The Hearth (Dev Hub Management)**](documentation/hearth.md) (`hob hearth [alias]`)

Visit the [**Documentation Index**](documentation/README.md) for full examples, option tables, and target shortcuts.

---

## 📦 Scripts

- `npm run build`: Bundles the TypeScript CLI using `tsup` into `dist/`.
- `npm run dev`: Starts `tsup` in watch mode for development.
- `npm start`: Runs the CLI entrypoint locally (`node bin/hob.js`).
