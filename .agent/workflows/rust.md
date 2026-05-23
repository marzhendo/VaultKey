---
description: Rust agent — implement all Tauri commands, cryptographic operations, database access, and application state for VaultKey. Never touches src/. Security-critical code only.
---

## Agent Identity

You are the **VaultKey Rust Agent**. Your sole responsibility is everything inside `src-tauri/`. You do not touch `src/` — that is the UI agent's domain. Your output is the secure foundation the entire application depends on. Every mistake here is a security vulnerability.

When in doubt: **refuse to implement and ask the user** rather than implement something insecure.

---

## Mandatory Pre-flight (run before every task)

Before writing a single line of code:

1. Read `.antigravity/rules.md` — specifically Section 3.2 (Rust crates), Section 3.3 (database schema), Section 7 (security constraints)
2. Read `src-tauri/Cargo.toml` — know what crates are already present before adding anything
3. Read `src-tauri/src/state.rs` — understand the current AppState before modifying commands
4. If the task involves crypto: re-read Section 7 of rules.md, all 7 constraints, before writing any function

---

## Your Core Rules

### Code style
- **No `unwrap()` in production paths.** Use `?` operator or explicit `match`. Every Tauri command must return `Result<T, String>` — map errors to descriptive strings.
- **Explicit types everywhere.** No type inference on function signatures.
- **One responsibility per module.** `kdf.rs` only derives keys. `cipher.rs` only encrypts/decrypts. `schema.rs` only manages the DB structure. Commands in `commands/` only orchestrate — they call crypto and db, they don't implement them.
- **Comments on every non-obvious block.** Especially in crypto code — explain what each step does and why.
- `use` imports grouped: std → third-party → local, with blank lines between groups.

### Security rules (non-negotiable)
1. **The encryption key (EK) never leaves `AppState`.** It is never returned from a Tauri command, never serialized to JSON, never written to disk.
2. **Nonce is always freshly generated per encrypt call.** Never reuse a nonce. Use `rand::thread_rng().gen::<[u8; 12]>()`.
3. **Argon2id parameters are fixed minimums.** `time_cost=3`, `mem_cost=65536`, `parallelism=1`. Never reduce, never make configurable.
4. **Zeroize sensitive data on drop.** EK in AppState must implement or use `zeroize::Zeroize`. When `lock_vault` is called, call `.zeroize()` before setting to `None`.
5. **No logging of sensitive values.** `println!`, `eprintln!`, `log::*` macros must never output: EK, master password, salt, nonce, or decrypted payload. Not even in `#[cfg(debug_assertions)]` blocks.
6. **No plaintext passwords in the database, ever.** Only `ciphertext: Vec<u8>` and `nonce: Vec<u8>` for sensitive fields.
7. **DB connection from AppState only.** No function opens a new DB connection on its own. Connection is created once at startup and held in `AppState`.

### Tauri command rules
- Every `#[tauri::command]` must be registered in `main.rs` `.invoke_handler()`. If you add a command and forget to register it, the UI will silently fail.
- Return type: always `Result<T, String>` — UI expects this shape.
- State access: always take `state: tauri::State<AppState>` as parameter when you need EK or DB access.
- Commands must be **synchronous at the Rust level** (no `async` unless truly needed) — Tauri handles threading.

---

## Module Build Order

Build modules in this exact order. Each module depends on the previous.

```
1. state.rs          — AppState definition
2. db/schema.rs      — DB init and table creation
3. crypto/kdf.rs     — Argon2id key derivation
4. crypto/cipher.rs  — AES-256-GCM encrypt/decrypt
5. commands/auth.rs  — setup_vault, unlock_vault, lock_vault
6. commands/entries.rs — get_entries, add_entry, update_entry, delete_entry, get_entry_detail, get_entry_password, toggle_favorite
7. commands/generator.rs — generate_password
8. main.rs           — wire everything together
```

---

## Module Specifications

### state.rs

```rust
// src-tauri/src/state.rs
// Holds the global application state behind Arc<Mutex<>> for thread safety.
// The encryption key (EK) lives here and ONLY here.

use std::sync::Mutex;
use rusqlite::Connection;
use zeroize::Zeroize;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub encryption_key: Mutex<Option<EncryptionKey>>,
}

// Wrapper so we can implement Zeroize on the key bytes
pub struct EncryptionKey(pub [u8; 32]);

impl Drop for EncryptionKey {
    fn drop(&mut self) {
        self.0.zeroize(); // wipe from memory when dropped
    }
}

impl AppState {
    pub fn new(conn: Connection) -> Self {
        Self {
            db: Mutex::new(conn),
            encryption_key: Mutex::new(None),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.encryption_key.lock().unwrap().is_some()
    }
}
```

### db/schema.rs

```rust
// src-tauri/src/db/schema.rs
// Initializes the database and runs migrations.
// Called once at app startup before AppState is built.

// Must create these tables if they don't exist:
// - users (id, created_at)
// - kdf_params (user_id, salt BLOB, time_cost, mem_cost, parallelism)
// - vault_entries (id, user_id, category, title, ciphertext BLOB, nonce BLOB, is_favorite, created_at, updated_at)

// Schema must match rules.md Section 3.3 exactly.
// Use `CREATE TABLE IF NOT EXISTS` — never DROP.
// Add a user_version PRAGMA for future migration support.

pub fn initialize(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;
        PRAGMA user_version=1;
        
        CREATE TABLE IF NOT EXISTS users ( ... );
        CREATE TABLE IF NOT EXISTS kdf_params ( ... );
        CREATE TABLE IF NOT EXISTS vault_entries ( ... );
    ")
}
```

### crypto/kdf.rs

```rust
// src-tauri/src/crypto/kdf.rs
// Derives a 32-byte encryption key from the master password using Argon2id.
// This is the ONLY place key derivation happens.

use argon2::{Argon2, Algorithm, Version, Params};
use rand::RngCore;

/// Generate a new random 16-byte salt.
/// Called once during setup_vault — never again for the same user.
pub fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    salt
}

/// Derive a 32-byte encryption key from master_password + salt.
/// Parameters are fixed — never accept them as arguments.
/// time_cost=3, mem_cost=65536 (64MB), parallelism=1, output_len=32
pub fn derive_key(master_password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let params = Params::new(65536, 3, 1, Some(32))
        .map_err(|e| format!("Argon2 params error: {}", e))?;
    
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(master_password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Key derivation failed: {}", e))?;
    
    Ok(key)
}
```

### crypto/cipher.rs

```rust
// src-tauri/src/crypto/cipher.rs
// AES-256-GCM encryption and decryption.
// This is the ONLY place encryption/decryption happens.

use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit};
use aes_gcm::aead::Aead;
use rand::RngCore;

/// Encrypt plaintext bytes with the given 32-byte key.
/// Generates a fresh 12-byte nonce on every call — never reuse.
/// Returns (ciphertext, nonce) — both must be stored.
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes); // fresh nonce every time
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    Ok((ciphertext, nonce_bytes))
}

/// Decrypt ciphertext bytes with the given key and nonce.
/// Returns plaintext bytes on success.
pub fn decrypt(key: &[u8; 32], ciphertext: &[u8], nonce: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(nonce);
    
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption failed — wrong master password or corrupted data".to_string())
}
```

### commands/auth.rs

Three commands: `setup_vault`, `unlock_vault`, `lock_vault`, `get_vault_status`.

```rust
// src-tauri/src/commands/auth.rs

/// get_vault_status
/// Returns: { "status": "no_vault" | "locked" | "unlocked" }
/// Called by React on app start to decide which screen to show.
/// Checks: does the users table have a row? Is the EK in AppState Some?
#[tauri::command]
pub fn get_vault_status(state: tauri::State<AppState>) -> Result<String, String>

/// setup_vault
/// Input: master_password: String
/// Steps:
///   1. Check no vault exists yet (users table empty) — return error if already set up
///   2. Generate salt via kdf::generate_salt()
///   3. Derive EK via kdf::derive_key(master_password, salt)
///   4. Insert row into users table
///   5. Insert kdf_params (user_id, salt, time_cost=3, mem_cost=65536, parallelism=1)
///   6. Store EK in AppState (vault is now unlocked after setup)
///   7. Return Ok("vault_created")
/// Never store master_password or EK in the database.
#[tauri::command]
pub fn setup_vault(master_password: String, state: tauri::State<AppState>) -> Result<String, String>

/// unlock_vault  
/// Input: master_password: String
/// Steps:
///   1. Fetch kdf_params (salt, time_cost, mem_cost, parallelism) from DB
///   2. Derive EK via kdf::derive_key(master_password, salt)
///   3. Verify EK is correct by attempting to decrypt one test entry
///      — if no entries exist, store EK optimistically (first unlock after setup)
///      — if entries exist, decrypt the first one; if it fails, EK is wrong
///   4. On success: store EK in AppState, return Ok("unlocked")
///   5. On failure: return Err("Invalid master password")
/// Note: There is no "master password hash" stored — correctness is verified by
/// attempting decryption. This is intentional (zero-knowledge).
#[tauri::command]
pub fn unlock_vault(master_password: String, state: tauri::State<AppState>) -> Result<String, String>

/// lock_vault
/// Steps:
///   1. Lock the encryption_key Mutex
///   2. Call .zeroize() on the key bytes before dropping
///   3. Set encryption_key to None
///   4. Return Ok("locked")
#[tauri::command]
pub fn lock_vault(state: tauri::State<AppState>) -> Result<String, String>
```

### commands/entries.rs

```rust
// src-tauri/src/commands/entries.rs

/// get_entries
/// Returns: Vec<VaultEntryMeta> — metadata only, NO password, NO ciphertext
/// VaultEntryMeta: { id, category, title, is_favorite, created_at, updated_at }
/// The username is NOT returned here — only returned via get_entry_detail
/// Requires vault to be unlocked (EK in AppState) — return Err if locked
#[tauri::command]
pub fn get_entries(state: tauri::State<AppState>) -> Result<Vec<VaultEntryMeta>, String>

/// get_entry_detail
/// Input: entry_id: i64
/// Returns: VaultEntryDetail { id, category, title, username, url, notes }
/// Steps:
///   1. Fetch ciphertext + nonce from DB for entry_id
///   2. Get EK from AppState — error if locked
///   3. Decrypt ciphertext via cipher::decrypt(ek, ciphertext, nonce)
///   4. Deserialize JSON payload: { username, password, url, notes }
///   5. Return { id, category, title, username, url, notes } — NO password field
/// Password is NOT included in this response — use get_entry_password for that
#[tauri::command]
pub fn get_entry_detail(entry_id: i64, state: tauri::State<AppState>) -> Result<VaultEntryDetail, String>

/// get_entry_password
/// Input: entry_id: i64
/// Returns: String (the decrypted password, used immediately for clipboard)
/// Steps:
///   1. Fetch ciphertext + nonce from DB
///   2. Decrypt
///   3. Deserialize and return only the password field
/// This is a separate command from get_entry_detail intentionally —
/// password is only fetched when the user explicitly clicks copy.
#[tauri::command]
pub fn get_entry_password(entry_id: i64, state: tauri::State<AppState>) -> Result<String, String>

/// add_entry
/// Input: AddEntryInput { category, title, username, password, url, notes }
/// Steps:
///   1. Get EK from AppState — error if locked
///   2. Build JSON payload: { username, password, url, notes }
///   3. Serialize to bytes
///   4. Encrypt via cipher::encrypt(ek, payload_bytes) → (ciphertext, nonce)
///   5. Insert into vault_entries: (user_id=1, category, title, ciphertext, nonce, is_favorite=0)
///   6. Return the new entry's id
#[tauri::command]
pub fn add_entry(input: AddEntryInput, state: tauri::State<AppState>) -> Result<i64, String>

/// update_entry
/// Input: UpdateEntryInput { id, category, title, username, password, url, notes }
/// Steps:
///   1. Get EK — error if locked
///   2. Build and encrypt new payload (fresh nonce — never reuse old nonce)
///   3. UPDATE vault_entries SET category=?, title=?, ciphertext=?, nonce=?, updated_at=datetime('now') WHERE id=?
///   4. Return Ok("updated")
#[tauri::command]
pub fn update_entry(input: UpdateEntryInput, state: tauri::State<AppState>) -> Result<String, String>

/// delete_entry
/// Input: entry_id: i64
/// Steps:
///   1. DELETE FROM vault_entries WHERE id=?
///   2. Return Ok("deleted")
/// No EK needed — deletion doesn't require decryption
#[tauri::command]
pub fn delete_entry(entry_id: i64, state: tauri::State<AppState>) -> Result<String, String>

/// toggle_favorite
/// Input: entry_id: i64
/// Steps:
///   1. SELECT is_favorite FROM vault_entries WHERE id=?
///   2. UPDATE vault_entries SET is_favorite = 1 - is_favorite WHERE id=?
///   3. Return new is_favorite value: bool
#[tauri::command]
pub fn toggle_favorite(entry_id: i64, state: tauri::State<AppState>) -> Result<bool, String>

/// get_categories
/// Returns: Vec<CategoryCount> { category: String, count: i64 }
/// SELECT category, COUNT(*) as count FROM vault_entries GROUP BY category
/// Used by sidebar to render category list with counts
#[tauri::command]
pub fn get_categories(state: tauri::State<AppState>) -> Result<Vec<CategoryCount>, String>
```

### commands/generator.rs

```rust
// src-tauri/src/commands/generator.rs
// Password generation using cryptographically secure randomness.
// Must use rand::thread_rng() — never Math.random() or similar.

/// generate_password
/// Input: GeneratorInput { length: u8, uppercase: bool, lowercase: bool, numbers: bool, symbols: bool }
/// Constraints:
///   - length must be 8–64 inclusive, clamp if outside range
///   - at least one character set must be true — return Err if all false
///   - Use rejection sampling to ensure uniform distribution across charset
///   - Guarantee at least one character from each enabled set in the output
/// Returns: String
#[tauri::command]
pub fn generate_password(input: GeneratorInput) -> Result<String, String>

// Character sets:
// uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
// lowercase: "abcdefghijklmnopqrstuvwxyz"
// numbers:   "0123456789"
// symbols:   "!@#$%^&*()-_=+[]{}|;:,.<>?"

// Algorithm:
// 1. Build charset string from enabled sets
// 2. Generate length random indices into charset using rand::thread_rng()
// 3. Ensure at least 1 char from each enabled set (swap if needed)
// 4. Shuffle result using Fisher-Yates with rand::thread_rng()
// 5. Return as String
```

### main.rs

```rust
// src-tauri/src/main.rs
// App entry point — initializes DB, builds AppState, registers all commands.

// Steps:
// 1. Get app data directory via tauri::api::path::app_data_dir()
// 2. Open SQLite connection to {app_data_dir}/vault.db
// 3. Run db::schema::initialize(&conn) to create tables
// 4. Build AppState::new(conn)
// 5. Register ALL commands in .invoke_handler(tauri::generate_handler![...])
// 6. Manage AppState with .manage(state)

// All commands to register:
// auth: get_vault_status, setup_vault, unlock_vault, lock_vault
// entries: get_entries, get_entry_detail, get_entry_password,
//          add_entry, update_entry, delete_entry, toggle_favorite, get_categories
// generator: generate_password
```

---

## Cargo.toml Dependencies

```toml
[dependencies]
tauri = { version = "1", features = ["api-all"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
argon2 = "0.5"
aes-gcm = "0.10"
rand = "0.8"
zeroize = { version = "1", features = ["derive"] }
```

Use `features = ["bundled"]` on rusqlite so SQLite is statically linked — no system SQLite dependency.

---

## Specific Agent Prompts

Use these exact prompts when starting each task in Antigravity chat:

### Prompt 1 — Cargo setup & AppState
```
/plan

Read .antigravity/rules.md Section 3.2 (Rust crates) and Section 7 (security constraints) fully.

Task: Set up Cargo.toml dependencies and implement state.rs.

Cargo.toml — add these exact dependencies, no others:
- tauri 1.x with api-all feature
- serde 1.x with derive feature
- serde_json 1.x
- rusqlite 0.31 with bundled feature
- argon2 0.5
- aes-gcm 0.10
- rand 0.8
- zeroize 1.x with derive feature

state.rs — implement AppState with:
- db: Mutex<Connection> field
- encryption_key: Mutex<Option<EncryptionKey>> field
- EncryptionKey newtype wrapper around [u8; 32]
- Drop impl on EncryptionKey that calls self.0.zeroize()
- AppState::new(conn: Connection) constructor
- AppState::is_unlocked(&self) -> bool helper

Security check: confirm EncryptionKey implements zeroize on drop before finishing.
```

### Prompt 2 — Database schema
```
/plan

Read .antigravity/rules.md Section 3.3 (database schema) fully.

Task: Implement db/schema.rs.

Create db/mod.rs (just pub mod schema;) and db/schema.rs with:
- initialize(conn: &Connection) -> Result<(), rusqlite::Error>
- Enable WAL journal mode and foreign keys via PRAGMA
- Set user_version = 1
- CREATE TABLE IF NOT EXISTS for: users, kdf_params, vault_entries
- Schema must match rules.md Section 3.3 exactly — column names, types, constraints

Do not add any columns not in the spec. Do not use DROP TABLE anywhere.
```

### Prompt 3 — Key derivation (kdf.rs)
```
/plan

Read .antigravity/rules.md Section 7, constraint 3 (Argon2id params) before starting.

Task: Implement crypto/kdf.rs.

Create crypto/mod.rs (pub mod kdf; pub mod cipher;) and crypto/kdf.rs with:

generate_salt() -> [u8; 16]
- Use rand::thread_rng().fill_bytes()
- Returns 16 random bytes

derive_key(master_password: &str, salt: &[u8]) -> Result<[u8; 32], String>
- Use Argon2id algorithm, Version V0x13
- Fixed params: time_cost=3, mem_cost=65536, parallelism=1, output_len=32
- Parameters must NOT be function arguments — they are hardcoded constants
- Map all errors to descriptive String

Security check: confirm params cannot be weakened by caller.
```

### Prompt 4 — Encryption (cipher.rs)
```
/plan

Read .antigravity/rules.md Section 7, constraints 1, 2, 3 before starting.

Task: Implement crypto/cipher.rs.

encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), String>
- Use Aes256Gcm from aes-gcm crate
- Generate fresh 12-byte nonce with rand::thread_rng() on every call
- Return (ciphertext, nonce) — both stored by caller
- Never accept a nonce as input — caller has no say in nonce generation

decrypt(key: &[u8; 32], ciphertext: &[u8], nonce: &[u8]) -> Result<Vec<u8>, String>
- On decryption failure: return generic error "Decryption failed" — do not leak why
- Never log the key, nonce, or decrypted bytes

Security checks:
- Nonce is generated inside this function, never passed in
- Error messages reveal no information about key correctness
```

### Prompt 5 — Auth commands
```
/plan

Read .antigravity/rules.md Section 7 (all 7 constraints) fully before starting.

Task: Implement commands/auth.rs with four Tauri commands.

get_vault_status(state) -> Result<String, String>
- Returns "no_vault" if users table is empty
- Returns "unlocked" if AppState.is_unlocked() is true  
- Returns "locked" otherwise

setup_vault(master_password: String, state) -> Result<String, String>
- Fail if vault already exists
- generate_salt() → derive_key() → insert users row → insert kdf_params row
- Store derived EK in AppState (unlock immediately after setup)
- Return "vault_created"
- Never store master_password or EK in DB

unlock_vault(master_password: String, state) -> Result<String, String>
- Fetch kdf_params from DB
- derive_key(master_password, salt)
- If entries exist: decrypt first entry to verify EK — return Err on failure
- If no entries: store EK directly (no verification needed)
- Store EK in AppState on success

lock_vault(state) -> Result<String, String>
- Zeroize and drop EK from AppState
- Return "locked"

After implementing: register all four in main.rs invoke_handler.
Security check: confirm master_password is not stored anywhere after derive_key() call.
```

### Prompt 6 — Entry commands
```
/plan

Read .antigravity/rules.md Section 3.3 (schema) and Section 7 (security constraints).

Task: Implement commands/entries.rs with all vault entry commands.

Define these serde structs first:
- VaultEntryMeta { id, category, title, is_favorite, created_at, updated_at }
- VaultEntryDetail { id, category, title, username, url, notes } — NO password field
- VaultPayload { username, password, url, notes } — the encrypted JSON shape
- AddEntryInput { category, title, username, password, url, notes }
- UpdateEntryInput { id, category, title, username, password, url, notes }
- CategoryCount { category, count }

Implement commands:
- get_entries → returns Vec<VaultEntryMeta>, no decryption needed
- get_entry_detail → decrypt → return VaultEntryDetail (no password)
- get_entry_password → decrypt → return password String only
- add_entry → encrypt payload → INSERT
- update_entry → encrypt new payload with FRESH nonce → UPDATE
- delete_entry → DELETE WHERE id=?
- toggle_favorite → flip 0/1
- get_categories → SELECT category, COUNT(*)

Critical: update_entry must generate a NEW nonce — never reuse the old one.
After implementing: register all in main.rs invoke_handler.
```

### Prompt 7 — Password generator
```
/plan

Read .antigravity/rules.md Section 3.2 (rand crate) and Section 7 (security constraints).

Task: Implement commands/generator.rs.

Define GeneratorInput { length: u8, uppercase: bool, lowercase: bool, numbers: bool, symbols: bool }

generate_password(input: GeneratorInput) -> Result<String, String>:
- Clamp length to 8–64
- Return Err if all charset flags are false
- Build charset from enabled sets:
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  lowercase: "abcdefghijklmnopqrstuvwxyz"  
  numbers:   "0123456789"
  symbols:   "!@#$%^&*()-_=+[]{}|;:,.<>?"
- Generate `length` random chars using rand::thread_rng() with rejection sampling for uniform distribution
- Guarantee at least 1 char from each enabled set
- Fisher-Yates shuffle the result
- Return as String

Must use rand::thread_rng() — no other RNG source.
After implementing: register in main.rs invoke_handler.
```

### Prompt 8 — main.rs wiring
```
/plan

Read src-tauri/src/commands/ to list all implemented commands before starting.

Task: Wire everything together in main.rs.

Steps:
1. Get app data directory via tauri::api::path::app_data_dir(&config)
2. Create vault.db path inside app data dir
3. Open rusqlite::Connection to that path
4. Run db::schema::initialize(&conn) — panic with helpful message if this fails (startup blocker)
5. Build AppState::new(conn)
6. In tauri::Builder::default():
   - .manage(state)
   - .invoke_handler(tauri::generate_handler![
       commands::auth::get_vault_status,
       commands::auth::setup_vault,
       commands::auth::unlock_vault,
       commands::auth::lock_vault,
       commands::entries::get_entries,
       commands::entries::get_entry_detail,
       commands::entries::get_entry_password,
       commands::entries::add_entry,
       commands::entries::update_entry,
       commands::entries::delete_entry,
       commands::entries::toggle_favorite,
       commands::entries::get_categories,
       commands::generator::generate_password,
     ])

Verify: every command in commands/ is in the invoke_handler list.
Verify: tauri.conf.json has minWidth: 800, minHeight: 560 under windows[0].
```
