# ⚡ Scratch Orgs (Lifecycle, Deployment & Purge)

[← Back to Documentation](README.md)

Manage temporary scratch orgs and automate the complete developer setup and synchronization pipeline:

```bash
hob scratch new [alias] [options]
hob scratch open [alias] [options]      # Shortcut: hob open [alias]
hob scratch deploy [alias] [options]    # Shortcut: hob deploy [alias] (or hob push)
hob scratch purge [options]
```

---

## 📖 Description

Hob provides intuitive commands to manage the full scratch org lifecycle:
- **`hob scratch new`**: Automates the end-to-end setup pipeline:
  1. **Kindles** the scratch org via `sf org create scratch`.
  2. **Carries** local source code into the org via `sf project deploy start`.
  3. **Grants** default permission sets (auto-discovered or configured via `.env` / flag).
  4. **Sows** test data seeds (runs `.apex` seed scripts or `.json` tree plans).
  5. **Opens** the browser to your ready-to-use scratch org.
- **`hob scratch open`** (or **`hob open`**): Opens the scratch org (or default org) in your browser, with options for specific Lightning paths or URL-only output.
- **`hob scratch deploy`** (or **`hob deploy`** / **`hob push`**): Re-deploys local source code and metadata changes into the scratch org.
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

### Opening a Scratch Org in the Browser

```bash
# Open the default scratch org in your default browser
hob scratch open
hob open

# Open a specific scratch org
hob scratch open feature-billing
hob open feature-billing

# Open directly to a specific Lightning page
hob open -p "lightning/o/Account/list"
hob open -p "lightning/setup/SetupOneHome/home"

# Open in a specific browser or incognito window
hob open -b chrome
hob open --private

# Display the frontdoor login URL without launching the browser
hob open --url-only
```

### Re-deploying Source Code to a Scratch Org

```bash
# Re-deploy local source changes to the default scratch org
hob scratch deploy
hob deploy
hob push

# Re-deploy to a specific scratch org
hob deploy feature-billing

# Deploy only specific directories or metadata components
hob deploy -d force-app/main/default/classes
hob deploy -m "ApexClass:OrderService,ApexClass:OrderServiceTest"

# Force deploy ignoring source tracking conflicts
hob deploy --ignore-conflicts
hob deploy -c

# Validate deployment without saving changes (dry-run)
hob deploy --dry-run

# Run local Apex tests during deployment
hob deploy -l RunLocalTests
```

### Purging Scratch Orgs (Keeping Limits Clean)

By default, `hob scratch purge` **only purges expired scratch orgs**, safely preserving your active development environments. To include active scratch orgs, explicitly pass `--all` (`-a`) or `--active-only`.

```bash
# Safely find and delete expired scratch orgs for the default Dev Hub (default mode)
hob scratch purge

# Delete all scratch orgs (both expired and active) linked to the Dev Hub
hob scratch purge --all
hob scratch purge -a

# Only delete active scratch orgs
hob scratch purge --active-only

# Purge expired scratch orgs without interactive confirmation prompt
hob scratch purge --no-prompt
hob scratch purge -f

# Dry run to see what would be deleted without making changes
hob scratch purge --dry-run
hob scratch purge --all --dry-run

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

### `hob scratch open [alias]` (Shortcut: `hob open [alias]`)

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `[alias]` | | Default org | Scratch org alias or username |
| `--path <path>` | `-p` | Home page | Navigation URL path to open (e.g. `lightning/o/Account/list`) |
| `--browser <browser>` | `-b` | System default | Browser where the org opens (`chrome`, `edge`, `firefox`) |
| `--url-only` | `-r` | `false` | Display navigation URL without launching browser |
| `--private` | | `false` | Open the org in an incognito/private browser window |
| `--help` | `-h` | | Display help for the command |

### `hob scratch deploy [alias]` (Shortcuts: `hob deploy [alias]`, `hob push`)

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `[alias]` | | Default org | Target scratch org alias or username |
| `--source-dir <dirs...>` | `-d` | Entire project | Path to local source files or directories to deploy |
| `--metadata <metadata...>`| `-m` | | Specific metadata components to deploy (e.g. `ApexClass:MyClass`) |
| `--manifest <file>` | `-x` | | Full file path for manifest (`package.xml`) of components to deploy |
| `--ignore-conflicts` | `-c` | `false` | Ignore conflicts and force deploy local changes |
| `--dry-run` | | `false` | Validate deployment against the org without persisting changes |
| `--test-level <level>` | `-l` | Org default | Apex testing level (`NoTestRun`, `RunSpecifiedTests`, `RunLocalTests`, `RunAllTestsInOrg`) |
| `--tests <tests...>` | `-t` | | Apex tests to run when `--test-level` is `RunSpecifiedTests` |
| `--concise` | | `false` | Display concise deployment output |
| `--help` | `-h` | | Display help for the command |

### `hob scratch purge`

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--target-dev-hub <devhub>`| `-v` | Default Dev Hub | Target Dev Hub org alias or username |
| `--all` | `-a` | `false` | Delete all scratch orgs (both expired and active) |
| `--expired-only` | | `true` (default) | Only delete expired scratch orgs |
| `--active-only` | | `false` | Only delete active scratch orgs |
| `--no-prompt` | `-p` | `false` | Do not prompt for confirmation before deleting |
| `--force` | `-f` | `false` | Force deletion without prompt (same as `--no-prompt`) |
| `--dry-run` | | `false` | Display scratch orgs that would be deleted without deleting them |
| `--include-unknown` | | `false` | Include scratch orgs whose Dev Hub relationship cannot be confirmed |
| `--help` | `-h` | | Display help for the command |

> [!TIP]
> **Safety Guard**: 
> 1. **Active Org Protection**: `hob scratch purge` defaults to `--expired-only` so running `hob scratch purge --no-prompt` in scripts or CI will never accidentally wipe active work. Use `--all` (`-a`) or `--active-only` when you deliberately want to delete active orgs.
> 2. **Dev Hub Isolation**: Hob strictly checks both `devHubUsername` and `devHubOrgId` against the selected Dev Hub. Scratch orgs with unconfirmed Dev Hub ownership (e.g., from direct auth logins or other hubs) are safely skipped by default to prevent accidental data loss. Pass `--include-unknown` only if you explicitly intend to purge unlinked scratch orgs.


