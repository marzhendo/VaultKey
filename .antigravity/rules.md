# VaultKey — Project Constitution

> This is the single source of truth for all decisions in this project.
> Read this file completely before planning, generating, or modifying any code.
> Every rule here is non-negotiable unless explicitly overridden by the user in chat.

---

## 1. Project Overview

**Name:** VaultKey  
**Type:** Desktop application — local only, no server, no cloud sync  
**Stack:** Tauri (Rust backend) + React (TypeScript frontend) + SQLite  
**Purpose:** Zero-knowledge local password manager for personal use  
**Security model:** All encryption/decryption happens in Rust. The frontend (React/JS) never touches plaintext passwords or encryption keys directly.

---

## 2. Agent Behavior Rules

### 2.1 General Conduct

- Always read and apply this entire file before starting any task.
- Before writing any code, produce an **Implementation Plan** outlining: what files will be changed, what the approach is, and any security implications.
- Never proceed past the planning stage without user confirmation on tasks that touch encryption, authentication, or database schema.
- If a task is ambiguous, ask one clarifying question before proceeding — do not assume and implement the wrong thing.
- Prefer small, reviewable changes over large sweeping rewrites. One logical change per implementation step.

### 2.2 Code Generation Rules

- Never generate placeholder or mock security logic (e.g., `// TODO: add real encryption`). Either implement it correctly or stop and ask.
- Never use `console.log` to output passwords, keys, salts, or any sensitive value — not even for debugging.
- Never store decrypted passwords or the encryption key in React state, localStorage, sessionStorage, or any JS-accessible storage.
- Always write TypeScript — no plain `.js` files in `src/`.
- Every new component must have a corresponding type definition. No `any` types.
- Follow the file structure defined in Section 4 exactly. Do not create files outside the defined structure without asking first.

### 2.3 Security-First Mindset

Before implementing any feature, the agent must ask: **"Could this expose a password or encryption key?"**

If yes → the implementation must go through Rust via `invoke()`, not JavaScript.

Critical operations that must ALWAYS be in Rust:
- Key derivation (Argon2id)
- Encryption (AES-256-GCM)
- Decryption (AES-256-GCM)
- Auto-lock (wiping EK from memory)
- Reading/writing to SQLite

### 2.4 When to Stop and Ask

Stop and ask the user before:
- Changing the database schema
- Changing the encryption algorithm or key derivation parameters
- Adding any new dependency (both Rust crate and npm package)
- Creating a new Tauri command (`#[tauri::command]`)
- Implementing any feature that wasn't in the original spec

---

## 3. Tech Stack & Versions

### 3.1 Frontend

| Tool | Version | Notes |
|---|---|---|
| React | 18.x | Functional components + hooks only. No class components. |
| TypeScript | 5.x | Strict mode enabled. No `any`. |
| Vite | 5.x | Build tool (Tauri default) |
| React Router | 6.x | Client-side routing |
| Zustand | 4.x | Global state management (session state only — no sensitive data) |
| Lucide React | latest | Icons only. No other icon libraries. |

**No CSS frameworks.** All styling is plain CSS with custom properties (tokens). No Tailwind, no MUI, no styled-components.

### 3.2 Backend (Rust / Tauri)

| Crate | Usage |
|---|---|
| `tauri` | App shell and IPC |
| `rusqlite` | SQLite database access |
| `argon2` | Master password key derivation |
| `aes-gcm` | AES-256-GCM encryption/decryption |
| `rand` | Cryptographically secure random (nonce, salt, password gen) |
| `serde` / `serde_json` | Serialization for Tauri commands |
| `zeroize` | Securely wipe sensitive data from memory |

Do not add other crates without asking.

### 3.3 Database

**Engine:** SQLite via `rusqlite`  
**File location:** Tauri app data directory (`app_data_dir()/vault.db`)  
**Never store:** plaintext passwords, encryption keys, or Argon2 output

#### Schema

```sql
-- User account (only one user in MVP)
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Argon2id salt (per user, stored separately for clarity)
CREATE TABLE IF NOT EXISTS kdf_params (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id),
  salt        BLOB NOT NULL,        -- 16 bytes random salt
  time_cost   INTEGER NOT NULL DEFAULT 3,
  mem_cost    INTEGER NOT NULL DEFAULT 65536,
  parallelism INTEGER NOT NULL DEFAULT 1
);

-- Vault entries (all sensitive fields are ciphertext)
CREATE TABLE IF NOT EXISTS vault_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  category    TEXT NOT NULL DEFAULT 'Default',
  title       TEXT NOT NULL,         -- plaintext (not sensitive)
  ciphertext  BLOB NOT NULL,         -- AES-256-GCM encrypted JSON payload
  nonce       BLOB NOT NULL,         -- 12 bytes unique per entry
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### Encrypted payload structure (inside `ciphertext`)

```json
{
  "username": "user@email.com",
  "password": "s3cr3tP@ss",
  "url": "https://example.com",
  "notes": "2FA backup: ..."
}
```

This JSON is serialized, encrypted with AES-256-GCM, and stored as `ciphertext`. The nonce is stored alongside it. Never encrypt/decrypt this on the JS side.

---

## 4. File Structure

```
vaultkey/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri app entry point
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── auth.rs           # setup_vault, unlock_vault, lock_vault
│   │   │   ├── entries.rs        # get_entries, add_entry, update_entry, delete_entry
│   │   │   └── generator.rs      # generate_password
│   │   ├── crypto/
│   │   │   ├── mod.rs
│   │   │   ├── kdf.rs            # Argon2id key derivation
│   │   │   └── cipher.rs         # AES-256-GCM encrypt/decrypt
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   └── schema.rs         # DB init and migrations
│   │   └── state.rs              # AppState (holds EK in memory, behind Mutex)
│   └── Cargo.toml
│
├── src/                          # React frontend
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Router setup
│   ├── styles/
│   │   ├── tokens.css            # All CSS custom properties (colors, spacing, etc.)
│   │   ├── reset.css             # Minimal CSS reset
│   │   └── global.css            # Base styles (body, typography defaults)
│   ├── components/
│   │   ├── ui/                   # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── IconButton.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Main shell (sidebar + topbar + content)
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── StatusBar.tsx
│   │   └── vault/
│   │       ├── EntryCard.tsx     # Single vault entry row
│   │       ├── EntryList.tsx     # List of EntryCards with section headers
│   │       ├── EntryModal.tsx    # Add/Edit modal
│   │       ├── DeleteConfirm.tsx # Delete confirmation modal
│   │       └── PasswordGenerator.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx         # Master password unlock screen
│   │   ├── SetupPage.tsx         # First-launch setup
│   │   └── DashboardPage.tsx     # Main vault screen
│   ├── store/
│   │   └── vaultStore.ts         # Zustand store (session state, NO sensitive data)
│   ├── hooks/
│   │   ├── useAutoLock.ts        # Idle timer → invoke lock_vault
│   │   └── useClipboard.ts       # Copy + auto-clear after 30s
│   └── types/
│       └── vault.ts              # Shared TypeScript interfaces
│
├── .antigravity/
│   └── rules.md                  # This file
├── .agent/
│   └── workflows/                # Antigravity workflow commands
│       ├── plan.md
│       ├── implement.md
│       └── review.md
└── package.json
```

---

## 5. Design System

### 5.1 Visual Direction

- **Style:** Clean, developer-centric, minimal — inspired by Linear and Raycast.
- **No decorative elements:** no gradients, no drop shadows, no blur, no glow.
- **Flat surfaces** with subtle borders to define hierarchy.
- **All styling via CSS custom properties** defined in `src/styles/tokens.css`.

### 5.2 Color Tokens

All tokens must be defined in `tokens.css` and referenced via `var(--token-name)` everywhere. Never hardcode hex values in component CSS.

```css
:root {
  /* Brand */
  --color-brand:         #534AB7;
  --color-brand-subtle:  #EEEDFE;
  --color-brand-border:  #AFA9EC;

  /* Surfaces */
  --color-bg-primary:    #FFFFFF;
  --color-bg-secondary:  #F5F5F3;
  --color-bg-tertiary:   #EFEFED;

  /* Text */
  --color-text-primary:   #1A1A1A;
  --color-text-secondary: #5A5A57;
  --color-text-tertiary:  #909090;

  /* Borders */
  --color-border:         rgba(0, 0, 0, 0.10);
  --color-border-strong:  rgba(0, 0, 0, 0.20);

  /* Semantic */
  --color-success: #1D9E75;
  --color-danger:  #E24B4A;
  --color-warning: #BA7517;
  --color-info:    #378ADD;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

[data-theme="dark"] {
  --color-brand:         #7F77DD;
  --color-brand-subtle:  #26215C;
  --color-brand-border:  #3C3489;

  --color-bg-primary:    #1A1A1A;
  --color-bg-secondary:  #242424;
  --color-bg-tertiary:   #2E2E2E;

  --color-text-primary:   #E8E8E6;
  --color-text-secondary: #9A9A96;
  --color-text-tertiary:  #606060;

  --color-border:         rgba(255, 255, 255, 0.10);
  --color-border-strong:  rgba(255, 255, 255, 0.20);
}
```

### 5.3 Typography Rules

- **Font:** `'Inter', system-ui, -apple-system, sans-serif`
- **Monospace (passwords only):** `'JetBrains Mono', 'Fira Code', monospace`
- **Allowed weights:** 400 (regular) and 500 (medium) only. Never 600 or 700.
- **Sizes:** 16px page title · 13px body · 11px caption/label · 13px monospace

### 5.4 Layout

App shell: custom title bar (32px, `data-tauri-drag-region`) + sidebar (200px fixed) + main area (flex-1) + status bar (28px).

Minimum window size: **800 × 560px** — enforce via `tauri.conf.json`.

### 5.5 Component Specs

**Vault Entry Card (52px height)**
- Icon: 32×32px, `--radius-sm`, category color (see table below)
- Title: 13px 500, `--color-text-primary`
- Subtitle: 11px 400, `--color-text-secondary`
- Password: always `••••••••` in list, 13px monospace
- Action buttons (28×28px): visible on row hover only
- Hover: `--color-bg-secondary` background

**Category icon colors:**
| Category | Background | Icon color |
|---|---|---|
| Campus | `#E8F0FE` | `#1A73E8` |
| Google | `#FCE8E8` | `#C5221F` |
| Social Media | `#F3E8FD` | `#8430CE` |
| Finance | `#E8F5E9` | `#1D9E75` |
| Dev Tools | `#F0F0F0` | `#3C3C3C` |
| Default | `--color-bg-tertiary` | `--color-text-secondary` |

**Modal:** 480px wide · `--radius-lg` · `rgba(0,0,0,0.45)` overlay · header + body + footer layout

**Inputs:** 36px height · `--color-bg-secondary` bg · `--color-border` border · `--radius-md` · focus: `--color-brand` border

**Buttons:**
| Variant | Background | Text |
|---|---|---|
| Primary | `--color-brand` | `#FFFFFF` |
| Ghost | transparent | `--color-text-secondary` |
| Danger | `--color-danger` | `#FFFFFF` |
| Icon | transparent | `--color-text-secondary` |

---

## 6. Interaction & Behavior Rules

### 6.1 Copy to Clipboard

1. User clicks copy icon → icon swaps to checkmark for 1500ms
2. Status bar shows "Copied to clipboard"
3. After **30 seconds**, clipboard is automatically cleared
4. This logic lives in `useClipboard.ts` — reuse it everywhere, do not reimplement inline

### 6.2 Auto-lock

- Default idle timeout: **5 minutes**
- At 1 minute remaining: status bar timer color → `--color-warning`
- On lock: call `invoke('lock_vault')` → Rust wipes EK from `AppState` using `zeroize`
- UI shows lock overlay: "VaultKey locked. Enter Master Password to continue."
- Logic lives in `useAutoLock.ts` — reset timer on any user interaction (mousemove, keydown, click)

### 6.3 Search

- Real-time, no debounce needed (local data)
- Searches: title, username/email, notes, category
- Empty result: show empty state, not an error

### 6.4 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + N` | Add new entry |
| `Ctrl/Cmd + F` | Focus search |
| `Ctrl/Cmd + L` | Lock vault immediately |
| `Ctrl/Cmd + G` | Open password generator |
| `Escape` | Close modal / clear search |

Register all shortcuts globally in `App.tsx` using `useEffect` with `window.addEventListener('keydown', ...)`.

---

## 7. Security Constraints (Non-Negotiable)

These rules override any other consideration including convenience, simplicity, or user request.

1. **Encryption key never leaves Rust.** The EK derived from Argon2id lives only in `AppState` behind a `Mutex<Option<[u8; 32]>>`. It is never serialized, never sent to JS, never logged.

2. **Plaintext payload never persists.** Decrypted entry data is returned to JS only for the duration of a single UI operation (display, copy). It must not be cached in Zustand or any store.

3. **Nonce must be unique per entry per write.** Generate a new 12-byte random nonce with `rand::thread_rng()` every time an entry is encrypted — on both create and update.

4. **Argon2id parameters must not be weakened.** Minimum: `time_cost=3`, `mem_cost=65536` (64MB), `parallelism=1`. Do not reduce these for performance.

5. **No clipboard persistence.** Clear clipboard after 30 seconds without exception.

6. **No logging of sensitive values.** `println!`, `eprintln!`, `log::debug!`, and `console.log` must never output passwords, keys, salts, nonces, or decrypted payloads. Even in development.

7. **SQLite file must not be readable without the key.** The DB stores only ciphertext + nonce. If someone opens `vault.db` with DB Browser, they see only binary blobs.

---

## 8. MVP Scope (Do Not Exceed)

Build only what is listed here. No scope creep.

**In scope:**
- [ ] First-launch setup (create master password)
- [ ] Login / unlock with master password
- [ ] List all vault entries with category grouping
- [ ] Add new entry
- [ ] Edit existing entry
- [ ] Delete entry (with confirmation)
- [ ] Copy username / copy password (one-click)
- [ ] Search / filter entries
- [ ] Password generator (length + character options)
- [ ] Auto-lock after idle
- [ ] Favorites (star/unstar)
- [ ] Category sidebar navigation
- [ ] Dark mode support

**Explicitly out of scope for MVP:**
- Browser extension / autofill
- Cloud sync or backup
- Multiple user accounts
- Import from other password managers
- TOTP / 2FA codes
- Biometric unlock
- Mobile version

---

## 9. Environment Setup & Development

This section outlines the setup process and development guidelines for configuring the local development environment on Windows.

### 9.1 Prerequisites

Before setting up the repository, make sure the following prerequisites are installed on your Windows machine:

1. **Microsoft C++ Build Tools**:
   - Required by the Rust compiler.
   - Download the [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
   - Select **Desktop development with C++** workload and ensure the defaults (MSVC build tools, Windows SDK) are checked.
   - Restart your machine after installation.

2. **Rust & Cargo Toolchain**:
   - Download and run `rustup-init.exe` from [rustup.rs](https://rustup.rs/).
   - Choose the default installation option (which targets `x86_64-pc-windows-msvc`).
   - Run `rustc --version` in terminal to verify installation.

3. **Node.js (LTS)**:
   - Install Node.js v18.x or v20.x+ from [nodejs.org](https://nodejs.org/).
   - Verify with `node --version` and `npm --version` in your terminal.

### 9.2 Initial Project Setup

Follow these steps to initialize the project dependencies once all prerequisites are met:

1. **Clone/Open the workspace**:
   Ensure you are in the workspace root directory containing `package.json`.

2. **Install Node.js dependencies**:
   Run the following command in PowerShell/Command Prompt:
   ```powershell
   npm install
   ```

3. **Verify Rust backend setup**:
   Tauri will automatically compile the Rust backend when running development or build commands. However, you can verify your Rust toolchain is properly configured by running:
   ```powershell
   cd src-tauri
   cargo check
   cd ..
   ```

### 9.3 Development Commands

Use the following npm scripts to run and build the application:

| Action | Command | Description |
|---|---|---|
| **Start Dev App** | `npm run tauri dev` | Starts the React dev server (with hot reload) and compiles/runs the Tauri Rust window. |
| **Build App** | `npm run tauri build` | Compiles the production bundle, bundles assets, and generates the Windows installer (`.msi`, `.exe`). |
| **Lint Code** | `npm run lint` | Runs the frontend linter to check for TypeScript/React style compliance. |

### 9.4 App Configuration & Windows Specifics

- **Tauri Config**: Main application configuration is located in `src-tauri/tauri.conf.json`.
- **Minimum Dimensions**: Ensure the window size is constrained to a minimum of **800 × 560px** under `tauri > windows` configuration:
  ```json
  "windows": [
    {
      "title": "VaultKey",
      "width": 800,
      "height": 560,
      "minWidth": 800,
      "minHeight": 560,
      "resizable": true
    }
  ]
  ```

### 9.5 Database Path & Development Inspection

As specified in the security and architecture requirements:
- The SQLite file (`vault.db`) resides in the secure local app data directory: `app_data_dir()`.
- On Windows, this directory maps to:
  `%APPDATA%\[Bundle Identifier]\vault.db` (e.g., `C:\Users\<username>\AppData\Roaming\com.vaultkey.app\vault.db`).
- **Inspection for Verification**:
  - The SQLite database must only contain encrypted ciphertext + nonces (except for category and title in `vault_entries` and `kdf_params` metadata).
  - You can inspect the SQLite structure locally during development using **DB Browser for SQLite** or **VS Code SQLite Viewer** by loading the `vault.db` file from the AppData directory. Never try to decrypt the db directly from JS or save the unencrypted db on your desktop.

