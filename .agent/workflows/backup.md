---
description: Backup agent — implement encrypted vault export and import. Allows users to back up their vault to a .vaultkey file and restore it on any machine.
---

## Agent Identity

You are the **VaultKey Backup Agent**. Your job is to implement export and import of the encrypted vault. This feature touches both Rust (file I/O, re-encryption) and React (file picker UI). Security rules from rules.md Section 7 apply fully here.

Before starting:
1. Read `.antigravity/rules.md` Section 7 (all 7 security constraints)
2. Read `src-tauri/src/crypto/cipher.rs` — understand existing encrypt/decrypt
3. Read `src-tauri/src/db/schema.rs` — understand vault_entries table structure
4. Read `src-tauri/src/state.rs` — understand AppState

---

## Feature Overview

The `.vaultkey` file is a portable encrypted backup of the vault. It is:
- **Encrypted with the user's master password** — same Argon2id + AES-256-GCM
- **Self-contained** — includes all entries, salt, and KDF params needed to decrypt
- **Not tied to a specific machine** — can be imported on any VaultKey installation
- **Human-unreadable** — opening it in a text editor shows only binary/base64 data

File format (JSON, then base64-encoded, then saved as `.vaultkey`):

```json
{
  "version": 1,
  "kdf": {
    "algorithm": "argon2id",
    "salt": "<base64>",
    "time_cost": 3,
    "mem_cost": 65536,
    "parallelism": 1
  },
  "entries": [
    {
      "category": "Campus",
      "title": "Student Portal",
      "ciphertext": "<base64>",
      "nonce": "<base64>",
      "is_favorite": false,
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ]
}
```

The `ciphertext` inside each entry is the **existing ciphertext from the DB** — no re-encryption needed. The same key that decrypts the DB also decrypts the export file.

---

## Prompt 1 — Rust: export and import commands

```
/plan

Read .antigravity/rules.md Section 7 (security constraints).
Read src-tauri/src/crypto/cipher.rs and src-tauri/src/db/schema.rs.
Read src-tauri/Cargo.toml before adding any crate.

Task: Add two new Rust commands — export_vault and import_vault.
Create file: src-tauri/src/commands/backup.rs

── Structs needed ──

#[derive(Serialize, Deserialize)]
struct BackupKdf {
    algorithm: String,  // always "argon2id"
    salt: String,       // base64-encoded
    time_cost: u32,
    mem_cost: u32,
    parallelism: u32,
}

#[derive(Serialize, Deserialize)]
struct BackupEntry {
    category: String,
    title: String,
    ciphertext: String,  // base64-encoded
    nonce: String,       // base64-encoded
    is_favorite: bool,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize, Deserialize)]
struct BackupFile {
    version: u32,        // always 1
    kdf: BackupKdf,
    entries: Vec<BackupEntry>,
}

── export_vault command ──

#[tauri::command]
pub fn export_vault(
    export_path: String,  // full file path chosen by user via dialog
    state: tauri::State<AppState>
) -> Result<String, String>

Steps:
1. Check vault is unlocked (EK in AppState) — return Err if locked
2. Fetch kdf_params from DB (salt, time_cost, mem_cost, parallelism)
3. Fetch all vault_entries from DB (all columns including ciphertext and nonce)
4. Build BackupFile struct:
   - version: 1
   - kdf: BackupKdf from fetched params (salt as base64)
   - entries: Vec<BackupEntry> from fetched entries (ciphertext and nonce as base64)
5. Serialize BackupFile to JSON string
6. Base64-encode the JSON string
7. Write base64 string to file at export_path
8. Return Ok("exported") with entry count

IMPORTANT: The existing ciphertext is exported as-is.
No re-encryption. No decryption. The EK is never used in export.
The backup file is protected by the same master password.

── import_vault command ──

#[tauri::command]
pub fn import_vault(
    import_path: String,   // full file path chosen by user
    master_password: String, // entered by user to verify before import
    state: tauri::State<AppState>
) -> Result<String, String>

Steps:
1. Read file at import_path
2. Base64-decode → JSON string
3. Parse JSON → BackupFile struct
   Return Err("Invalid backup file format") if parse fails
4. Validate version == 1
   Return Err("Unsupported backup version") if not
5. Derive key from master_password + backup's salt using backup's KDF params
   Use existing kdf::derive_key()
6. Verify the key is correct by attempting to decrypt the FIRST entry's ciphertext
   Return Err("Incorrect master password for this backup") if decrypt fails
   If no entries in backup: skip verification (empty vault backup)
7. Ask user to confirm overwrite — this is handled on UI side before calling command
8. Clear existing vault_entries from DB (DELETE FROM vault_entries WHERE user_id=1)
9. Update kdf_params with backup's salt and params
   (This changes the master password to match the backup's master password)
10. Insert all backup entries into vault_entries
    - Decode base64 ciphertext and nonce back to Vec<u8>
    - Insert with original category, title, is_favorite, created_at, updated_at
11. Update AppState EK with the newly derived key
12. Return Ok("imported {count} entries")

SECURITY NOTE: After import, the vault's master password is now the one
from the backup file. If the user had a different master password before,
it is replaced. This is intentional — the backup is self-contained.

── Add to Cargo.toml if not present ──
base64 = "0.21"

── Register in main.rs ──
commands::backup::export_vault,
commands::backup::import_vault,
```

---

## Prompt 2 — React: Export UI

```
/plan

Read src/components/ui/Modal.tsx, Button.tsx, ToastContainer logic.
Read src/store/vaultStore.ts.

Task: Build export vault UI.

── 2A. Export trigger in Sidebar ──
File: src/components/layout/Sidebar.tsx

Below the Generator button, add:
  "Export vault" — ghost button, full width, Lucide Download icon
  onClick: opens ExportModal

── 2B. ExportModal component ──
File: src/components/vault/ExportModal.tsx

Props:
  onClose: () => void

Modal: 440px wide, --radius-lg

Content:
  Header: "Export vault" + X close button
  
  Body:
    Icon: Lucide Download (32px, --color-brand) centered
    
    Title: "Back up your vault" (14px / 500)
    
    Description (13px / --color-text-secondary):
      "Export an encrypted backup of all your vault entries.
       The backup is protected by your current master password.
       Store it somewhere safe — Google Drive, USB drive, or cloud storage."
    
    Info box (--color-brand-subtle bg, --color-brand-border border, --radius-md):
      Lucide Info icon (14px, --color-brand) + text (12px):
      "Your backup file is encrypted. Anyone who finds it still needs
       your master password to read it."
    
    Export count: "Your vault contains {entries.length} entries" 
    (11px / --color-text-tertiary, read from vaultStore)

  Footer:
    "Cancel" ghost button
    "Export .vaultkey file" primary button → handleExport()

handleExport():
  1. Open Tauri save dialog:
     import { save } from '@tauri-apps/api/dialog'
     const filePath = await save({
       defaultPath: 'vaultkey-backup.vaultkey',
       filters: [{ name: 'VaultKey Backup', extensions: ['vaultkey'] }]
     })
  2. If filePath is null (user cancelled): return
  3. Set button isLoading = true
  4. await invoke('export_vault', { exportPath: filePath })
  5. toast.success('Vault exported successfully')
  6. onClose()
  
  On error:
  toast.error('Export failed. Please try again.')
```

---

## Prompt 3 — React: Import UI

```
/plan

Read src/components/ui/Modal.tsx, Button.tsx, Input.tsx.
Read src/store/vaultStore.ts.

Task: Build import vault UI with confirmation step.

── 3A. Import trigger in Sidebar ──
File: src/components/layout/Sidebar.tsx

Below "Export vault" button, add:
  "Import backup" — ghost button, full width, Lucide Upload icon
  onClick: opens ImportModal

── 3B. ImportModal component ──
File: src/components/vault/ImportModal.tsx

Props:
  onClose: () => void
  onImported: () => void  — called after successful import, parent refreshes entries

Modal: 440px wide, --radius-lg — two-step flow

── Step 1: File selection ──

Header: "Import backup" + X close
Body:
  Icon: Lucide Upload (32px, --color-brand) centered
  Title: "Restore from backup"
  Description: "Select a .vaultkey backup file to restore your entries."
  
  Warning box (--color-warning bg at 10% opacity, --color-warning border):
    Lucide AlertTriangle (14px, --color-warning) + text (12px / --color-warning):
    "Importing will replace ALL current vault entries.
     Your existing entries will be permanently deleted."
  
  File picker button:
    Ghost button, full width, Lucide FolderOpen icon
    Label: "Choose .vaultkey file" (if no file selected)
    Label: filename only (if file selected, --color-success)
    
    onClick:
      import { open } from '@tauri-apps/api/dialog'
      const filePath = await open({
        filters: [{ name: 'VaultKey Backup', extensions: ['vaultkey'] }],
        multiple: false
      })
      setSelectedFile(filePath)

Footer:
  "Cancel" ghost
  "Continue" primary (disabled if no file selected) → go to Step 2

── Step 2: Password confirmation ──

Header: "Confirm master password" + back arrow button (goes to Step 1)
Body:
  Icon: Lucide ShieldCheck (32px, --color-brand) centered
  Title: "Enter the backup's master password"
  Description (13px / --color-text-secondary):
    "Enter the master password that was used when this backup was created.
     This may be different from your current master password."
  
  Password input (show/hide toggle)
  Inline error area (hidden until error)

Footer:
  "Back" ghost → go to Step 1
  "Import vault" danger button → handleImport()
  (danger variant because this is destructive)

handleImport():
  1. Set isLoading = true
  2. await invoke('import_vault', {
       importPath: selectedFile,
       masterPassword: passwordInput
     })
  3. On success:
     toast.success('Vault imported successfully — {count} entries restored')
     vaultStore.setEntries([]) — triggers refresh
     onImported() — parent calls refreshEntries()
     onClose()
  4. On error "Incorrect master password":
     Show inline error below password input: "Incorrect master password for this backup"
     Keep modal open, clear password field
  5. On error (other):
     toast.error('Import failed. The backup file may be corrupted.')
     Keep modal open

── 3C. Wire modals into DashboardPage ──
File: src/pages/DashboardPage.tsx

Add state:
  showExportModal: boolean
  showImportModal: boolean

Pass handlers down to Sidebar:
  onExportClick={() => setShowExportModal(true)}
  onImportClick={() => setShowImportModal(true)}

Render modals:
  {showExportModal && (
    <ExportModal onClose={() => setShowExportModal(false)} />
  )}
  {showImportModal && (
    <ImportModal
      onClose={() => setShowImportModal(false)}
      onImported={refreshEntries}
    />
  )}
```

---

## Prompt 4 — Final integration check

```
/plan

Task: End-to-end verification of the export/import feature.

Do NOT write new code in this step. Only verify and fix.

── Checklist ──

Rust side:
- [ ] export_vault never calls decrypt — it only reads raw ciphertext from DB
- [ ] import_vault verifies master password before deleting existing entries
- [ ] import_vault deletes existing entries AFTER verification succeeds, not before
- [ ] base64 crate is in Cargo.toml
- [ ] Both commands registered in main.rs invoke_handler

React side:
- [ ] ExportModal reads entry count from vaultStore (not from invoke)
- [ ] ImportModal Step 2 password field cleared on error
- [ ] ImportModal "Import vault" button is danger variant (destructive action)
- [ ] File dialog uses correct extensions filter (.vaultkey)
- [ ] onImported() callback triggers refreshEntries() in DashboardPage

Security:
- [ ] export_vault: EK never accessed, no decryption happens
- [ ] import_vault: master_password parameter is used only for key derivation,
      never stored, never returned
- [ ] Existing entries only deleted AFTER successful password verification

Run: npx tsc --noEmit
Confirm: zero TypeScript errors

If any check fails: fix it before marking done.
```
