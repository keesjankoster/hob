# 🪄 Scaffolding Projects

[← Back to Documentation](README.md)

Hob sweeps up the boilerplate, scaffolds your Salesforce DX project with a manifest, initializes Git, and makes your first commit:

```bash
hob create project <name> [options]
```

---

## 📖 Description

Under the hood, Hob coordinates with the Salesforce CLI (`sf template generate project`) while taking care of the tedious chores:
- Generates standard SFDX project structure and configuration (`sfdx-project.json`).
- Automatically generates the manifest file (`manifest/package.xml`) by default.
- Initializes a Git repository (`git init`) and creates an initial commit (`git commit -m "chore: initial salesforce dx project setup by Hob 🧦"`) by default.

---

## 💡 Examples

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

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--template <template>` | `-t` | `standard` | Template to use (`standard`, `empty`, `analytics`, etc.) |
| `--output-dir <dir>` | `-d` | `.` | Directory for saving the created project |
| `--default-package-dir <dir>` | `-p` | `force-app` | Default package directory name |
| `--namespace <namespace>` | `-s` | — | Namespace associated with this project |
| `--manifest / --no-manifest` | | `true` | Generate a manifest (`manifest/package.xml`) |
| `--git / --no-git` | | `true` | Initialize a Git repo and make the initial commit |
| `--help` | `-h` | | Display help for the command |
