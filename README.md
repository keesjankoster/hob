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

## 📦 Scripts

- `npm run build`: Bundles the TypeScript CLI using `tsup` into `dist/`.
- `npm run dev`: Starts `tsup` in watch mode for development.
- `npm start`: Runs the CLI entrypoint locally (`node bin/hob.js`).
