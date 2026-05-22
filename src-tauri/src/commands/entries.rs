use crate::state::AppState;
use tauri::State;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct VaultEntry {
    pub id: Option<i64>,
    pub category: String,
    pub title: String,
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub is_favorite: bool,
}

#[tauri::command]
pub fn get_entries(_state: State<'_, AppState>) -> Result<Vec<VaultEntry>, String> {
    // Boilerplate for now
    Ok(Vec::new())
}

#[tauri::command]
pub fn add_entry(_state: State<'_, AppState>, _entry: VaultEntry) -> Result<i64, String> {
    // Boilerplate for now
    Ok(0)
}

#[tauri::command]
pub fn update_entry(_state: State<'_, AppState>, _entry: VaultEntry) -> Result<(), String> {
    // Boilerplate for now
    Ok(())
}

#[tauri::command]
pub fn delete_entry(_state: State<'_, AppState>, _id: i64) -> Result<(), String> {
    // Boilerplate for now
    Ok(())
}
