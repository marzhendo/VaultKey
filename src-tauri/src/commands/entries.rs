use crate::state::AppState;
use tauri::State;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct VaultEntry {
    pub id: i64,
    pub category: String,
    pub title: String,
    pub is_favorite: bool,
    pub username: Option<String>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct VaultEntryDetail {
    pub id: i64,
    pub category: String,
    pub title: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub is_favorite: bool,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct VaultPayload {
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn get_entries(state: State<'_, AppState>) -> Result<Vec<VaultEntry>, String> {
    let key_guard = state.encryption_key.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ek = key_guard.as_ref().ok_or("Vault is locked".to_string())?;

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let mut stmt = db.prepare("SELECT id, category, title, ciphertext, nonce, is_favorite FROM vault_entries")
        .map_err(|e| format!("Database prepare failed: {}", e))?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Vec<u8>>(3)?,
            row.get::<_, Vec<u8>>(4)?,
            row.get::<_, i64>(5)? != 0,
        ))
    }).map_err(|e| format!("Query failed: {}", e))?;

    let mut entries = Vec::new();
    for row_res in rows {
        let (id, category, title, ciphertext, nonce, is_favorite) = row_res.map_err(|e| e.to_string())?;
        
        let decrypted_bytes = crate::crypto::cipher::decrypt(&ek.0, &ciphertext, &nonce)?;
        let payload: VaultPayload = serde_json::from_slice(&decrypted_bytes)
            .map_err(|e| format!("Failed to parse payload: {}", e))?;

        entries.push(VaultEntry {
            id,
            category,
            title,
            is_favorite,
            username: payload.username,
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn add_entry(
    state: State<'_, AppState>,
    category: String,
    title: String,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
) -> Result<i64, String> {
    let key_guard = state.encryption_key.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ek = key_guard.as_ref().ok_or("Vault is locked".to_string())?;

    let payload = VaultPayload {
        username,
        password,
        url,
        notes,
    };
    let payload_bytes = serde_json::to_vec(&payload)
        .map_err(|e| format!("Failed to serialize payload: {}", e))?;

    let (ciphertext, nonce) = crate::crypto::cipher::encrypt(&ek.0, &payload_bytes)?;

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.execute(
        "INSERT INTO vault_entries (user_id, category, title, ciphertext, nonce, is_favorite) VALUES (1, ?, ?, ?, ?, 0)",
        rusqlite::params![category, title, ciphertext, nonce.as_ref()],
    ).map_err(|e| format!("Failed to insert entry: {}", e))?;

    let id = db.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
pub fn update_entry(
    state: State<'_, AppState>,
    id: i64,
    category: String,
    title: String,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
) -> Result<(), String> {
    let key_guard = state.encryption_key.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ek = key_guard.as_ref().ok_or("Vault is locked".to_string())?;

    let payload = VaultPayload {
        username,
        password,
        url,
        notes,
    };
    let payload_bytes = serde_json::to_vec(&payload)
        .map_err(|e| format!("Failed to serialize payload: {}", e))?;

    let (ciphertext, nonce) = crate::crypto::cipher::encrypt(&ek.0, &payload_bytes)?;

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let rows_affected = db.execute(
        "UPDATE vault_entries SET category = ?, title = ?, ciphertext = ?, nonce = ?, updated_at = datetime('now') WHERE id = ?",
        rusqlite::params![category, title, ciphertext, nonce.as_ref(), id],
    ).map_err(|e| format!("Failed to update entry: {}", e))?;

    if rows_affected == 0 {
        return Err("Entry not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn delete_entry(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let rows_affected = db.execute("DELETE FROM vault_entries WHERE id = ?", [id])
        .map_err(|e| format!("Failed to delete entry: {}", e))?;

    if rows_affected == 0 {
        return Err("Entry not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn get_categories(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let mut stmt = db.prepare("SELECT DISTINCT category FROM vault_entries")
        .map_err(|e| format!("Database prepare failed: {}", e))?;

    let rows = stmt.query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| format!("Query failed: {}", e))?;

    let mut categories = Vec::new();
    for row_res in rows {
        let cat = row_res.map_err(|e| e.to_string())?;
        categories.push(cat);
    }

    categories.sort();
    categories.dedup();

    let defaults = ["Campus", "Google", "Social Media", "Finance", "Dev Tools", "Default"];
    for default_cat in &defaults {
        let cat_str = default_cat.to_string();
        if !categories.contains(&cat_str) {
            categories.push(cat_str);
        }
    }

    Ok(categories)
}

#[tauri::command]
pub fn toggle_favorite(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let rows_affected = db.execute(
        "UPDATE vault_entries SET is_favorite = 1 - is_favorite, updated_at = datetime('now') WHERE id = ?",
        [id],
    ).map_err(|e| format!("Failed to toggle favorite: {}", e))?;

    if rows_affected == 0 {
        return Err("Entry not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn get_entry_password(state: State<'_, AppState>, id: i64) -> Result<String, String> {
    let key_guard = state.encryption_key.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ek = key_guard.as_ref().ok_or("Vault is locked".to_string())?;

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let mut stmt = db.prepare("SELECT ciphertext, nonce FROM vault_entries WHERE id = ?")
        .map_err(|e| format!("Database prepare failed: {}", e))?;

    let (ciphertext, nonce) = stmt.query_row([id], |row| {
        Ok((row.get::<_, Vec<u8>>(0)?, row.get::<_, Vec<u8>>(1)?))
    }).map_err(|_| "Entry not found".to_string())?;

    let decrypted_bytes = crate::crypto::cipher::decrypt(&ek.0, &ciphertext, &nonce)?;
    let payload: VaultPayload = serde_json::from_slice(&decrypted_bytes)
        .map_err(|e| format!("Failed to parse payload: {}", e))?;

    Ok(payload.password.unwrap_or_default())
}

#[tauri::command]
pub fn get_entry_detail(state: State<'_, AppState>, id: i64) -> Result<VaultEntryDetail, String> {
    let key_guard = state.encryption_key.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ek = key_guard.as_ref().ok_or("Vault is locked".to_string())?;

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let mut stmt = db.prepare("SELECT category, title, ciphertext, nonce, is_favorite FROM vault_entries WHERE id = ?")
        .map_err(|e| format!("Database prepare failed: {}", e))?;

    let (category, title, ciphertext, nonce, is_favorite) = stmt.query_row([id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, Vec<u8>>(2)?,
            row.get::<_, Vec<u8>>(3)?,
            row.get::<_, i64>(4)? != 0,
        ))
    }).map_err(|_| "Entry not found".to_string())?;

    let decrypted_bytes = crate::crypto::cipher::decrypt(&ek.0, &ciphertext, &nonce)?;
    let payload: VaultPayload = serde_json::from_slice(&decrypted_bytes)
        .map_err(|e| format!("Failed to parse payload: {}", e))?;

    Ok(VaultEntryDetail {
        id,
        category,
        title,
        username: payload.username,
        password: payload.password,
        url: payload.url,
        notes: payload.notes,
        is_favorite,
    })
}

