# 🕯️ Lighting the Hearth

[← Back to Documentation](README.md)

Light the hearth: Authorize your Salesforce Dev Hub org and set it as the default Dev Hub for creating and managing scratch orgs:

```bash
hob hearth [alias] [options]
```

---

## 📖 Description

In traditional folklore, a Hob belongs to a hearth—and from the hearth, all fires are kindled. In Salesforce DX, the Dev Hub is that central hearth: the parent org from which all temporary scratch orgs are kindled and managed.

Under the hood, Hob coordinates with `sf org login web --set-default-dev-hub`, launching your web browser to complete the OAuth login flow, while automatically tagging the org with your specified alias and setting it as the default Dev Hub.

---

## 💡 Examples

```bash
# Light the hearth with the default alias ('devhub')
hob hearth

# Light the hearth with a custom alias (positional)
hob hearth my-dev-hub

# Light the hearth using the alias flag
hob hearth -a my-dev-hub

# With a specific instance or custom login URL
hob hearth -r https://login.salesforce.com -a my-dev-hub

# Open login in a specific browser
hob hearth --browser chrome
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `[alias]` | | `devhub` | Positional argument for org alias |
| `--alias <alias>` | `-a` | `devhub` | Alias for the Dev Hub org |
| `--instance-url <url>` | `-r` | `https://login.salesforce.com` | URL of the instance that the org lives on |
| `--browser <browser>` | `-b` | System default | Browser to open (`chrome`, `edge`, `firefox`) |
| `--help` | `-h` | | Display help for the command |
