---
description: README agent — write a comprehensive, professional README.md for VaultKey including screenshots, architecture overview, and setup instructions.
---

## Agent Identity

You are the **VaultKey README Agent**. Your job is to write a professional, well-structured `README.md` that accurately represents VaultKey as a serious security-focused desktop application. The README must be honest, technical, and visually appealing on GitHub.

Before starting:
1. Read `.antigravity/rules.md` — understand the project overview, tech stack, and security model
2. Read `src-tauri/Cargo.toml` — get exact crate versions
3. Read `package.json` — get exact npm dependency versions
4. Read `src-tauri/src/crypto/kdf.rs` and `cipher.rs` — understand crypto implementation to describe it accurately

---

## Screenshot Requirements

Before writing the README, confirm the following screenshot files exist in the `docs/screenshots/` directory. If the directory doesn't exist, create it and instruct the user to add screenshots there.

Required screenshots:
```
docs/screenshots/
├── 01-setup.png          — SetupPage step 1 (master password creation)
├── 02-login.png          — LoginPage (unlock screen)
├── 03-dashboard-light.png — Dashboard in light mode with entries visible
├── 04-dashboard-dark.png  — Dashboard in dark mode with entries visible
├── 05-add-entry.png      — EntryModal open (add new entry)
├── 06-generator.png      — Password generator modal
├── 07-export.png         — Export vault modal
├── 08-import.png         — Import backup modal step 2
```

If any screenshot is missing:
- Write the README with placeholder paths: `docs/screenshots/01-setup.png`
- Add a comment above each image: `<!-- Replace with actual screenshot -->`
- At the end of the README, add a section "## 📸 Adding Screenshots" that instructs the user to add screenshots to `docs/screenshots/`

---

## README Structure

Write the README in this exact order:

### 1. Header

```markdown
<div align="center">
  <img src="docs/screenshots/logo.png" alt="VaultKey Logo" width="80" />
  
  # VaultKey
  
  **A zero-knowledge local password manager built with Tauri + Rust + React**
  
  ![Tauri](https://img.shields.io/badge/Tauri-1.x-blue?logo=tauri)
  ![Rust](https://img.shields.io/badge/Rust-stable-orange?logo=rust)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
  ![License](https://img.shields.io/badge/License-MIT-green)
</div>
```

### 2. One-liner description
One sentence, no fluff:
"VaultKey is a desktop password manager that stores all your credentials locally, encrypted with AES-256-GCM, with zero data ever leaving your machine."

### 3. Screenshot showcase
Dashboard screenshot (light + dark side by side if possible, or separate).
Use HTML img tags for size control:
```html
<img src="docs/screenshots/03-dashboard-light.png" alt="VaultKey Dashboard" width="100%" />
```

### 4. Features section
Use a clean two-column layout with checkboxes:

```markdown
## ✨ Features

| Security | Usability |
|---|---|
| ✅ Zero-knowledge architecture | ✅ One-click copy with auto-clear |
| ✅ AES-256-GCM encryption | ✅ Password generator |
| ✅ Argon2id key derivation | ✅ Category organization |
| ✅ Encryption key never leaves RAM | ✅ Instant search |
| ✅ Auto-lock on idle | ✅ Dark mode |
| ✅ Clipboard auto-clear (30s) | ✅ Encrypted backup & restore |
```

### 5. Security Architecture section
This is the most important section — explain the zero-knowledge model clearly:

```markdown
## 🔐 Security Architecture

VaultKey uses a **zero-knowledge** design: the application never stores or transmits your master password or encryption key.

### How it works

1. **Master Password → Encryption Key**  
   Your master password is never stored. Instead, it's run through **Argon2id** 
   (time_cost=3, mem_cost=64MB) to derive a 32-byte encryption key (EK).

2. **Client-side Encryption**  
   Every vault entry is encrypted with **AES-256-GCM** before being written to disk.
   Each entry has a unique 12-byte random nonce — nonces are never reused.

3. **What's stored on disk**  
   Only ciphertext + nonce is written to `vault.db`. 
   Opening the database without the master password reveals only binary blobs.

4. **Auto-lock**  
   After 5 minutes of inactivity, the EK is **zeroized from RAM** using the 
   `zeroize` crate. The vault cannot be accessed until the master password is re-entered.

5. **Clipboard safety**  
   Copied passwords are automatically cleared from the clipboard after **30 seconds**.

### What VaultKey does NOT do
- ❌ Send data to any server
- ❌ Store your master password
- ❌ Keep decrypted passwords in memory beyond immediate use
- ❌ Log any sensitive values
```

### 6. Tech Stack section

```markdown
## 🛠 Tech Stack

### Desktop Shell
- **[Tauri](https://tauri.app/)** — Rust-based desktop framework (lightweight, secure)

### Backend (Rust)
| Crate | Purpose |
|---|---|
| `argon2` | Key derivation from master password |
| `aes-gcm` | AES-256-GCM encryption/decryption |
| `rand` | Cryptographically secure randomness |
| `rusqlite` | Local SQLite database |
| `zeroize` | Secure memory wiping on lock |

### Frontend (React/TypeScript)
| Package | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Zustand | Session state management |
| Lucide React | Icons |
| React Router 6 | Client-side routing |
```

### 7. Screenshots section
Show each major screen with a caption:

```markdown
## 📸 Screenshots

### Setup & Login
<img src="docs/screenshots/01-setup.png" alt="Setup" width="49%" />
<img src="docs/screenshots/02-login.png" alt="Login" width="49%" />

### Dashboard
<img src="docs/screenshots/03-dashboard-light.png" alt="Dashboard Light" width="49%" />
<img src="docs/screenshots/04-dashboard-dark.png" alt="Dashboard Dark" width="49%" />

### Entry Management
<img src="docs/screenshots/05-add-entry.png" alt="Add Entry" width="49%" />
<img src="docs/screenshots/06-generator.png" alt="Password Generator" width="49%" />

### Backup & Restore
<img src="docs/screenshots/07-export.png" alt="Export Vault" width="49%" />
<img src="docs/screenshots/08-import.png" alt="Import Backup" width="49%" />
```

### 8. Getting Started section

```markdown
## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/vaultkey.git
cd vaultkey

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

The installer will be generated in `src-tauri/target/release/bundle/`.

### First Launch
1. Open VaultKey
2. Create your **master password** — choose something strong and memorable
3. ⚠️ **There is no password recovery**. If you forget your master password, your data cannot be retrieved. This is by design.
```

### 9. Backup & Restore section

```markdown
## 💾 Backup & Restore

VaultKey supports encrypted vault backups via `.vaultkey` files.

**Export:** Sidebar → "Export vault" → choose a save location  
**Import:** Sidebar → "Import backup" → select `.vaultkey` file → enter backup's master password

The backup file is encrypted with the same master password — it cannot be read without it.
Store your backup in a safe location: Google Drive, USB drive, or cloud storage.

> ⚠️ Importing replaces all current vault entries. This action cannot be undone.
```

### 10. Data & Privacy section

```markdown
## 🛡 Data & Privacy

- All data is stored **locally** in your OS app data directory
- No accounts, no servers, no telemetry
- VaultKey has **no internet connectivity** — it cannot make network requests

**Data location:**
- Windows: `%APPDATA%\VaultKey\vault.db`
- macOS: `~/Library/Application Support/VaultKey/vault.db`
- Linux: `~/.local/share/VaultKey/vault.db`
```

### 11. License section

```markdown
## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ using Tauri, Rust, and React
</div>
```

---

## Motivation (use this as the basis for the opening section)

The author built VaultKey out of a personal frustration: forgetting passwords constantly
and having to reset them repeatedly — for university accounts, Gmail, and other services.
This was inefficient and annoying. Rather than relying on an existing password manager,
they decided to build one from scratch, with full control over the security model.

The result is VaultKey: a local-only, zero-knowledge password manager where no data
ever leaves the machine, and the author understands every line of code protecting their credentials.

Use this as a brief "Background" or "Why VaultKey" section near the top of the README,
written in third person, serious and grounded — not dramatic, not self-congratulatory.
One short paragraph maximum. Example tone:

  "VaultKey was built to solve a simple problem: constantly resetting forgotten passwords
  is inefficient. Rather than trusting a third-party service with sensitive credentials,
  this project takes a different approach — store everything locally, encrypt everything
  client-side, and never send a byte to any server."

Do NOT use phrases like: "born out of", "passion project", "journey", "excited to share",
"I hope you find this useful", or any other filler that sounds like an AI wrote it.

---

## Writing Guidelines

- **Language:** English only
- **Tone:** Serious and technical — written by a developer, for developers
- **No AI tells:** avoid "delve", "straightforward", "it's worth noting", "robust",
  "seamlessly", "leverage", "cutting-edge", "blazing fast", "revolutionary"
- **No marketing language** — no hype, no adjectives that aren't backed by specifics
- **Be precise about security claims** — say exactly what algorithm and parameters are used
- **Honest about limitations** — explicitly state "no password recovery by design"
- **First person avoided** — write in third person or imperative ("VaultKey stores...", "Run this command...")
- **Short sentences** — if a sentence has more than two clauses, split it
- **Keep it scannable** — use headers, tables, and code blocks generously
- **No filler conclusions** — do not end sections with "overall", "in summary", or motivational sign-offs

## Output

Write the complete README.md to the project root:
`/README.md`

After writing, confirm:
- [ ] All screenshot paths reference `docs/screenshots/`
- [ ] Security section accurately describes Argon2id params (time=3, mem=64MB)
- [ ] "No internet connectivity" claim is accurate (verify Tauri allowlist in tauri.conf.json)
- [ ] Data location paths are correct for all three OS
- [ ] No marketing language
- [ ] npx tsc --noEmit still passes after README is added (it should — .md files don't affect TS)
