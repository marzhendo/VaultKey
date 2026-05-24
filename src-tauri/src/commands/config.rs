use tauri::AppHandle;
use std::fs;
use std::path::PathBuf;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AppConfig {
    pub theme: String,
}

fn get_config_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to resolve app data directory".to_string())?;
    
    // Ensure parent directory exists
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    
    path.push("config.json");
    Ok(path)
}

#[tauri::command]
pub fn get_theme(app_handle: tauri::AppHandle) -> Result<String, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() {
        return Ok("light".to_string());
    }
    
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&content).unwrap_or(AppConfig {
        theme: "light".to_string(),
    });
    Ok(config.theme)
}

#[tauri::command]
pub fn set_theme(app_handle: tauri::AppHandle, theme: String) -> Result<(), String> {
    if theme != "light" && theme != "dark" {
        return Err("Invalid theme value".to_string());
    }
    
    let path = get_config_path(&app_handle)?;
    let config = AppConfig { theme };
    let content = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}
