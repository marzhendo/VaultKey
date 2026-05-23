use crate::state::AppState;
use tauri::State;
use zeroize::Zeroize;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

static IS_INITIALIZED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub fn get_vault_status(state: State<'_, AppState>) -> Result<String, String> {
    if !IS_INITIALIZED.load(Ordering::Relaxed) {
        return Ok("uninitialized".to_string());
    }
    
    if let Ok(key_state) = state.key.lock() {
        if key_state.0.is_some() {
            return Ok("unlocked".to_string());
        }
    }
    
    Ok("locked".to_string())
}

#[tauri::command]
pub fn setup_vault(state: State<'_, AppState>, _password: String) -> Result<(), String> {
    if let Ok(mut key_state) = state.key.lock() {
        key_state.0 = Some([0u8; 32]);
    }
    IS_INITIALIZED.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
pub fn unlock_vault(state: State<'_, AppState>, _password: String) -> Result<bool, String> {
    if let Ok(mut key_state) = state.key.lock() {
        key_state.0 = Some([0u8; 32]);
    }
    IS_INITIALIZED.store(true, Ordering::Relaxed);
    Ok(true)
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    if let Ok(mut key_state) = state.key.lock() {
        key_state.zeroize();
    }
    Ok(())
}

