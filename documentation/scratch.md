# ⚡ Scratch Orgs (Lifecycle & Purge)

[← Back to Documentation](README.md)

Manage temporary scratch orgs and automate the complete developer setup pipeline:

```bash
hob scratch new [alias] [options]
hob scratch purge [options]
```

---

## 📖 Description

Kindling scratch orgs should not require typing out five separate CLI commands and waiting for each step manually.

Hob provides two specialized commands to manage the full scratch org lifecycle:
- **`hob scratch new`**: Automates the end-to-end setup pipeline:
  1. **Kindles** the scratch org via `sf org create scratch`.
  2. **Carries** local source code into the org via `sf project deploy start`.
  3. **Grants** default permission sets (auto-discovered or configured via `.env` / flag).
  4. **Sows** test data seeds (runs `.apex` seed scripts or `.json` tree plans).
  5. **Opens** the browser to your ready-to-use scratch org.
- **`hob scratch purge`**: Sweeps the Dev Hub hearth by finding and deleting expired or active scratch orgs to keep your active scratch org limits clean.

---

## 💡 Examples

### Creating a Fully Provisioned Scratch Org

```bash
# Provision a scratch org with default alias ('scratch-org') and 7 days duration
hob scratch new

# Provision with a custom alias and 14 days duration
hob scratch new feature-billing -d 14

# With specific permission sets
hob scratch new my-org -p "Sales_Admin,Billing_User"

# With a specific test data seed script
hob scratch new demo-org -s scripts/apex/seed.apex

# Run headless without opening browser
hob scratch new ci-org --no-open

# Target a specific Dev Hub
hob scratch new test-org -v my-devhub
```

### Purging Scratch Orgs (Keeping Limits Clean)

```bash
# Interactively preview and delete all scratch orgs for the default Dev Hub
hob scratch purge

# Purge without interactive confirmation prompt
hob scratch purge --no-prompt
hob scratch purge -f

# Only delete expired scratch orgs
hob scratch purge --expired-only

# Only delete active scratch orgs
hob scratch purge --active-only

# Dry run to see what would be deleted without making changes
hob scratch purge --dry-run

# Target a specific Dev Hub
hob scratch purge -v my-devhub
```

---

## ⚙️ Options

### `hob scratch new [alias]`

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `[alias]` | | `scratch-org` | Positional alias for the scratch org |
| `--duration <days>` | `-d` | `7` | Scratch org lifetime in days (configurable via `HOB_SCRATCH_DURATION`) |
| `--definition-file <file>` | `-f` | `config/project-scratch-def.json` | Scratch org definition file (configurable via `HOB_SCRATCH_DEF_PATH`) |
| `--target-dev-hub <devhub>`| `-v` | Default Dev Hub | Dev Hub org alias or username |
| `--permission-sets <names...>`| `-p` | Auto-discovered | Permission sets to assign (space or comma separated, or `HOB_SCRATCH_PERMSETS`) |
| `--seed-script <path>` | `-s` | Auto-discovered | Path to Apex seed script (`.apex`) or data import plan (`.json`) |
| `--no-open` | | `false` | Do not open the scratch org in a browser |
| `--no-set-default` | | `false` | Do not set the created scratch org as default |
| `--browser <browser>` | `-b` | System default | Browser to open (`chrome`, `edge`, `firefox`) |
| `--help` | `-h` | | Display help for the command |

### `hob scratch purge`

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--target-dev-hub <devhub>`| `-v` | Default Dev Hub | Target Dev Hub org alias or username |
| `--expired-only` | | `false` | Only delete expired scratch orgs |
| `--active-only` | | `false` | Only delete active scratch orgs |
| `--no-prompt` | `-p` | `false` | Do not prompt for confirmation before deleting |
| `--force` | `-f` | `false` | Force deletion without prompt (same as `--no-prompt`) |
| `--dry-run` | | `false` | Display scratch orgs that would be deleted without deleting them |
| `--include-unknown` | | `false` | Include scratch orgs whose Dev Hub relationship cannot be confirmed |
| `--help` | `-h` | | Display help for the command |

> [!TIP]
> **Safety Guard**: `hob scratch purge` strictly checks both `devHubUsername` and `devHubOrgId` against the selected Dev Hub. Scratch orgs with unconfirmed Dev Hub ownership (e.g., from direct auth logins or other hubs) are safely skipped by default to prevent accidental data loss. Pass `--include-unknown` only if you explicitly intend to purge unlinked scratch orgs.

