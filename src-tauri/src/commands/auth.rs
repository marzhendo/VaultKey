use crate::state::AppState;
use tauri::State;
use zeroize::Zeroize;

#[tauri::command]
pub fn setup_vault(state: State<'_, AppState>, _password: String) -> Result<(), String> {
    // Boilerplate for now
    Ok(())
}

#[tauri::command]
pub fn unlock_vault(state: State<'_, AppState>, _password: String) -> Result<bool, String> {
    // Boilerplate for now
    Ok(true)
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    if let Ok(mut key_state) = state.key.lock() {
        key_state.zeroize();
    }
    Ok(())
}
