use crate::state::AppState;
use tauri::State;
use std::sync::Mutex;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct VaultEntry {
    pub id: Option<i64>,
    pub category: String,
    pub title: String,
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
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

#[tauri::command]
pub fn get_entries(state: State<'_, AppState>) -> Result<Vec<VaultEntry>, String> {
    if let Ok(db) = state.db.lock() {
        let entries = db.iter().map(|item| VaultEntry {
            id: Some(item.id),
            category: item.category.clone(),
            title: item.title.clone(),
            ciphertext: Vec::new(),
            nonce: Vec::new(),
            is_favorite: item.is_favorite,
            username: item.username.clone(),
        }).collect();
        Ok(entries)
    } else {
        Err("Failed to lock database".to_string())
    }
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
    if let Ok(mut db) = state.db.lock() {
        let next_id = db.iter().map(|item| item.id).max().unwrap_or(0) + 1;
        let new_entry = VaultEntryDetail {
            id: next_id,
            category,
            title,
            username,
            password,
            url,
            notes,
            is_favorite: false,
        };
        db.push(new_entry);
        Ok(next_id)
    } else {
        Err("Failed to lock database".to_string())
    }
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
    if let Ok(mut db) = state.db.lock() {
        if let Some(item) = db.iter_mut().find(|item| item.id == id) {
            item.category = category;
            item.title = title;
            item.username = username;
            item.password = password;
            item.url = url;
            item.notes = notes;
            Ok(())
        } else {
            Err("Entry not found".to_string())
        }
    } else {
        Err("Failed to lock database".to_string())
    }
}

#[tauri::command]
pub fn delete_entry(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    if let Ok(mut db) = state.db.lock() {
        let len_before = db.len();
        db.retain(|item| item.id != id);
        if db.len() < len_before {
            Ok(())
        } else {
            Err("Entry not found".to_string())
        }
    } else {
        Err("Failed to lock database".to_string())
    }
}

#[tauri::command]
pub fn get_categories(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    if let Ok(db) = state.db.lock() {
        let mut categories: Vec<String> = db.iter().map(|item| item.category.clone()).collect();
        categories.sort();
        categories.dedup();
        // Add defaults if they don't exist
        for default_cat in &["Campus", "Google", "Social Media", "Finance", "Dev Tools", "Default"] {
            let cat_str = default_cat.to_string();
            if !categories.contains(&cat_str) {
                categories.push(cat_str);
            }
        }
        Ok(categories)
    } else {
        Err("Failed to lock database".to_string())
    }
}

#[tauri::command]
pub fn toggle_favorite(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    if let Ok(mut db) = state.db.lock() {
        if let Some(item) = db.iter_mut().find(|item| item.id == id) {
            item.is_favorite = !item.is_favorite;
            Ok(())
        } else {
            Err("Entry not found".to_string())
        }
    } else {
        Err("Failed to lock database".to_string())
    }
}

#[tauri::command]
pub fn get_entry_password(state: State<'_, AppState>, id: i64) -> Result<String, String> {
    if let Ok(db) = state.db.lock() {
        if let Some(item) = db.iter().find(|item| item.id == id) {
            Ok(item.password.clone().unwrap_or_default())
        } else {
            Err("Entry not found".to_string())
        }
    } else {
        Err("Failed to lock database".to_string())
    }
}

#[tauri::command]
pub fn get_entry_detail(state: State<'_, AppState>, id: i64) -> Result<VaultEntryDetail, String> {
    if let Ok(db) = state.db.lock() {
        if let Some(item) = db.iter().find(|item| item.id == id) {
            Ok(item.clone())
        } else {
            Err("Entry not found".to_string())
        }
    } else {
        Err("Failed to lock database".to_string())
    }
}

