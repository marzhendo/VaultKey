// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod crypto;
mod db;
mod state;

use state::AppState;

fn main() {
    let context = tauri::generate_context!();
    
    let app_dir = tauri::api::path::app_data_dir(context.config())
        .expect("Failed to resolve app data directory");
        
    std::fs::create_dir_all(&app_dir)
        .expect("Failed to create app data directory");
        
    let db_path = app_dir.join("vault.db");
    
    let conn = rusqlite::Connection::open(&db_path)
        .expect("Failed to open SQLite database connection");
        
    db::schema::initialize(&conn)
        .expect("Failed to initialize SQLite database schema");
        
    let state = AppState::new(conn);

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::auth::get_vault_status,
            commands::auth::setup_vault,
            commands::auth::unlock_vault,
            commands::auth::lock_vault,
            commands::entries::get_entries,
            commands::entries::add_entry,
            commands::entries::update_entry,
            commands::entries::delete_entry,
            commands::entries::get_categories,
            commands::entries::toggle_favorite,
            commands::entries::get_entry_password,
            commands::entries::get_entry_detail,
            commands::generator::generate_password,
        ])
        .run(context)
        .expect("error while running tauri application");
}
