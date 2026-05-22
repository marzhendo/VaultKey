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
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::auth::setup_vault,
            commands::auth::unlock_vault,
            commands::auth::lock_vault,
            commands::entries::get_entries,
            commands::entries::add_entry,
            commands::entries::update_entry,
            commands::entries::delete_entry,
            commands::generator::generate_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
