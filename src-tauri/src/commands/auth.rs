use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_vault_status(state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let mut stmt = db.prepare("SELECT EXISTS(SELECT 1 FROM users LIMIT 1)")
        .map_err(|e| format!("Database query error: {}", e))?;
    let exists: bool = stmt.query_row([], |row| row.get(0))
        .map_err(|e| format!("Database query failed: {}", e))?;

    if !exists {
        return Ok("uninitialized".to_string());
    }
    
    if state.is_unlocked() {
        Ok("unlocked".to_string())
    } else {
        Ok("locked".to_string())
    }
}

#[tauri::command]
pub fn setup_vault(state: State<'_, AppState>, password: String) -> Result<(), String> {
    // 1. Check no vault exists yet (users table empty) — return error if already set up
    let mut db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let mut stmt = db.prepare("SELECT EXISTS(SELECT 1 FROM users LIMIT 1)")
        .map_err(|e| format!("Database query error: {}", e))?;
    let exists: bool = stmt.query_row([], |row| row.get(0))
        .map_err(|e| format!("Database query failed: {}", e))?;

    if exists {
        return Err("Vault has already been set up".to_string());
    }

    // Start transaction to insert user and KDF params atomically
    let tx = db.transaction().map_err(|e| format!("Transaction error: {}", e))?;

    // 2. Generate salt via kdf::generate_salt()
    let salt = crate::crypto::kdf::generate_salt();

    // 3. Derive EK via kdf::derive_key(password, salt)
    let ek_bytes = crate::crypto::kdf::derive_key(&password, &salt)?;

    // 4. Insert row into users table
    tx.execute("INSERT INTO users (id) VALUES (1)", [])
        .map_err(|e| format!("Failed to create user: {}", e))?;

    // 5. Insert kdf_params (user_id, salt, time_cost=3, mem_cost=65536, parallelism=1)
    tx.execute(
        "INSERT INTO kdf_params (user_id, salt, time_cost, mem_cost, parallelism) VALUES (1, ?, 3, 65536, 1)",
        [salt.as_ref()],
    ).map_err(|e| format!("Failed to save KDF parameters: {}", e))?;

    tx.commit().map_err(|e| format!("Transaction commit failed: {}", e))?;

    // 6. Store EK in AppState (vault is now unlocked after setup)
    if let Ok(mut key_guard) = state.encryption_key.lock() {
        *key_guard = Some(crate::state::EncryptionKey(ek_bytes));
    }

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(state: State<'_, AppState>, password: String) -> Result<bool, String> {
    // 1. Fetch kdf_params from DB
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let mut stmt = db.prepare("SELECT salt FROM kdf_params WHERE user_id = 1")
        .map_err(|e| format!("Database query error: {}", e))?;
    let salt: Vec<u8> = stmt.query_row([], |row| row.get(0))
        .map_err(|_| "Vault is not initialized".to_string())?;

    // 2. Derive EK
    let derived_key = crate::crypto::kdf::derive_key(&password, &salt)?;

    // 3. Verify EK is correct by attempting to decrypt one test entry
    // Check if any vault entries exist
    let mut stmt_entries = db.prepare("SELECT ciphertext, nonce FROM vault_entries LIMIT 1")
        .map_err(|e| format!("Database query error: {}", e))?;
    let entry_opt = stmt_entries.query_row([], |row| {
        Ok((row.get::<_, Vec<u8>>(0)?, row.get::<_, Vec<u8>>(1)?))
    });

    match entry_opt {
        Ok((ciphertext, nonce)) => {
            // Decrypt the first one; if it fails, EK is wrong
            crate::crypto::cipher::decrypt(&derived_key, &ciphertext, &nonce)
                .map_err(|_| "Invalid master password".to_string())?;
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            // If no entries exist, store EK optimistically (first unlock after setup or empty vault)
        }
        Err(e) => {
            return Err(format!("Database error during key verification: {}", e));
        }
    }

    // 4. On success: store EK in AppState
    if let Ok(mut key_guard) = state.encryption_key.lock() {
        *key_guard = Some(crate::state::EncryptionKey(derived_key));
    }

    Ok(true)
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    if let Ok(mut key_guard) = state.encryption_key.lock() {
        *key_guard = None; // Drop trigger automatically runs zeroize on EncryptionKey bytes
    }
    Ok(())
}

