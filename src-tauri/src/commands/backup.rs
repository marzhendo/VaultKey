use crate::state::AppState;
use tauri::State;
use serde::{Serialize, Deserialize};
use base64::{prelude::BASE64_STANDARD, Engine};
use std::fs;

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

#[tauri::command]
pub fn export_vault(
    export_path: String,
    state: State<'_, AppState>
) -> Result<String, String> {
    // 1. Check vault is unlocked (EK in AppState) — return Err if locked
    if !state.is_unlocked() {
        return Err("Vault is locked".to_string());
    }

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 2. Fetch kdf_params from DB
    let mut stmt_kdf = db.prepare("SELECT salt, time_cost, mem_cost, parallelism FROM kdf_params WHERE user_id = 1")
        .map_err(|e| format!("Database prepare failed: {}", e))?;
    let (salt_bytes, time_cost, mem_cost, parallelism) = stmt_kdf.query_row([], |row| {
        Ok((
            row.get::<_, Vec<u8>>(0)?,
            row.get::<_, u32>(1)?,
            row.get::<_, u32>(2)?,
            row.get::<_, u32>(3)?,
        ))
    }).map_err(|e| format!("Failed to fetch KDF parameters: {}", e))?;

    drop(stmt_kdf);

    // 3. Fetch all vault_entries from DB
    let mut stmt_entries = db.prepare("SELECT category, title, ciphertext, nonce, is_favorite, created_at, updated_at FROM vault_entries")
        .map_err(|e| format!("Database prepare failed: {}", e))?;
    let rows = stmt_entries.query_map([], |row| {
        Ok(BackupEntry {
            category: row.get::<_, String>(0)?,
            title: row.get::<_, String>(1)?,
            ciphertext: BASE64_STANDARD.encode(&row.get::<_, Vec<u8>>(2)?),
            nonce: BASE64_STANDARD.encode(&row.get::<_, Vec<u8>>(3)?),
            is_favorite: row.get::<_, i64>(4)? != 0,
            created_at: row.get::<_, String>(5)?,
            updated_at: row.get::<_, String>(6)?,
        })
    }).map_err(|e| format!("Query vault entries failed: {}", e))?;

    let mut entries = Vec::new();
    for row in rows {
        entries.push(row.map_err(|e| e.to_string())?);
    }

    // 4. Build BackupFile struct
    let backup = BackupFile {
        version: 1,
        kdf: BackupKdf {
            algorithm: "argon2id".to_string(),
            salt: BASE64_STANDARD.encode(&salt_bytes),
            time_cost,
            mem_cost,
            parallelism,
        },
        entries,
    };

    // 5. Serialize BackupFile to JSON string
    let json_str = serde_json::to_string(&backup)
        .map_err(|e| format!("Failed to serialize backup: {}", e))?;

    // 6. Base64-encode the JSON string
    let b64_json = BASE64_STANDARD.encode(json_str.as_bytes());

    // 7. Write base64 string to file at export_path
    fs::write(&export_path, b64_json)
        .map_err(|e| format!("Failed to write backup file: {}", e))?;

    Ok(format!("Successfully exported {} entries", backup.entries.len()))
}

#[tauri::command]
pub fn import_vault(
    import_path: String,
    master_password: String,
    state: State<'_, AppState>
) -> Result<String, String> {
    // 1. Read file at import_path
    let b64_json = fs::read_to_string(&import_path)
        .map_err(|e| format!("Failed to read backup file: {}", e))?;

    // 2. Base64-decode → JSON string
    let json_bytes = BASE64_STANDARD.decode(b64_json.trim())
        .map_err(|_| "Invalid backup file format (Base64 decode failed)".to_string())?;
    let json_str = String::from_utf8(json_bytes)
        .map_err(|_| "Invalid backup file format (UTF-8 conversion failed)".to_string())?;

    // 3. Parse JSON → BackupFile struct
    let backup: BackupFile = serde_json::from_str(&json_str)
        .map_err(|_| "Invalid backup file format (JSON parsing failed)".to_string())?;

    // 4. Validate version == 1
    if backup.version != 1 {
        return Err("Unsupported backup version".to_string());
    }

    if backup.kdf.algorithm != "argon2id" {
        return Err("Unsupported KDF algorithm".to_string());
    }

    // 5. Derive key from master_password + backup's salt using backup's KDF params
    let backup_salt = BASE64_STANDARD.decode(&backup.kdf.salt)
        .map_err(|_| "Failed to decode backup salt".to_string())?;
    let derived_key = crate::crypto::kdf::derive_key(&master_password, &backup_salt)?;

    // 6. Verify the key is correct by attempting to decrypt the FIRST entry's ciphertext
    if let Some(first_entry) = backup.entries.first() {
        let ciphertext_bytes = BASE64_STANDARD.decode(&first_entry.ciphertext)
            .map_err(|_| "Failed to decode test entry ciphertext".to_string())?;
        let nonce_bytes = BASE64_STANDARD.decode(&first_entry.nonce)
            .map_err(|_| "Failed to decode test entry nonce".to_string())?;

        crate::crypto::cipher::decrypt(&derived_key, &ciphertext_bytes, &nonce_bytes)
            .map_err(|_| "Incorrect master password for this backup".to_string())?;
    }

    // 7. Atomic transaction for database modifications
    let mut db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let tx = db.transaction().map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 8. Clear existing vault_entries from DB
    tx.execute("DELETE FROM vault_entries WHERE user_id = 1", [])
        .map_err(|e| format!("Failed to clear existing entries: {}", e))?;

    // 9. Update kdf_params with backup's salt and params
    tx.execute(
        "UPDATE kdf_params SET salt = ?, time_cost = ?, mem_cost = ?, parallelism = ? WHERE user_id = 1",
        rusqlite::params![
            backup_salt,
            backup.kdf.time_cost,
            backup.kdf.mem_cost,
            backup.kdf.parallelism
        ],
    ).map_err(|e| format!("Failed to update KDF parameters: {}", e))?;

    // 10. Insert all backup entries into vault_entries
    for entry in &backup.entries {
        let ciphertext_bytes = BASE64_STANDARD.decode(&entry.ciphertext)
            .map_err(|e| format!("Failed to decode entry ciphertext: {}", e))?;
        let nonce_bytes = BASE64_STANDARD.decode(&entry.nonce)
            .map_err(|e| format!("Failed to decode entry nonce: {}", e))?;

        tx.execute(
            "INSERT INTO vault_entries (user_id, category, title, ciphertext, nonce, is_favorite, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                entry.category,
                entry.title,
                ciphertext_bytes,
                nonce_bytes,
                if entry.is_favorite { 1 } else { 0 },
                entry.created_at,
                entry.updated_at
            ],
        ).map_err(|e| format!("Failed to insert backup entry: {}", e))?;
    }

    // Commit transaction atomically
    tx.commit().map_err(|e| format!("Failed to commit import transaction: {}", e))?;

    // 11. Update AppState EK with the newly derived key
    if let Ok(mut key_guard) = state.encryption_key.lock() {
        *key_guard = Some(crate::state::EncryptionKey(derived_key));
    }

    Ok(format!("Successfully imported {} entries", backup.entries.len()))
}
