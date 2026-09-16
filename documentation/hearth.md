# 🕯️ The Hearth (Dev Hub Management)

[← Back to Documentation](README.md)

Light, inspect, or sweep your Dev Hub hearths:

```bash
hob hearth [alias] [options]
```

---

## 📖 Description

In traditional folklore, a Hob belongs to a hearth—and from the hearth, all fires are kindled. In Salesforce DX, the **Dev Hub** is that central hearth: the parent org from which all temporary scratch orgs are kindled and managed.

Hob provides a unified command to manage your hearths:
- **Light the Hearth**: Authorize a Dev Hub org with `sf org login web --set-default-dev-hub` and set it as default.
- **Inspect Hearths (`--list`)**: View all connected Dev Hubs with their aliases, usernames, org IDs, connection status, and default designation in a clean table.
- **Sweep the Hearth (`--clean`)**: Sweep away the dead ashes by removing all local authorizations for inactive and expired scratch orgs (`sf org list --clean`).

---

## 💡 Examples

### Lighting the Hearth (Authorize Dev Hub)

```bash
# Light the hearth with default alias ('devhub')
hob hearth

# Light the hearth with a custom alias
hob hearth my-dev-hub

# Light using the alias flag
hob hearth -a my-dev-hub

# With a specific instance or custom login URL
hob hearth -r https://login.salesforce.com -a my-dev-hub

# Open login in a specific browser
hob hearth --browser chrome
```

### Inspecting Hearths (List)

```bash
# List all authorized Dev Hubs
hob hearth --list

# Subcommand shortcut
hob hearth list
```

### Sweeping the Hearth (Clean Inactive Scratch Orgs)

```bash
# Sweep the hearth to clean up expired/deleted scratch org authorizations
hob hearth --clean

# Subcommand shortcut
hob hearth clean
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `-l, --list` | `-l` | | List all authorized Dev Hub hearths |
| `-c, --clean` | `-c` | | Sweep the hearth: remove inactive and expired scratch org authorizations |
| `-p, --no-prompt` | `-p` | `true` | Do not prompt for confirmation when sweeping the hearth |
| `[alias]` | | `devhub` | Positional argument for org alias when lighting |
| `-a, --alias <alias>` | `-a` | `devhub` | Alias for the Dev Hub org when lighting |
| `--instance-url <url>` | `-r` | `https://login.salesforce.com` | URL of the instance that the org lives on |
| `--browser <browser>` | `-b` | System default | Browser to open (`chrome`, `edge`, `firefox`) |
| `--help` | `-h` | | Display help for the command |
