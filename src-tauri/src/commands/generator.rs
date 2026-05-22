#[tauri::command]
pub fn generate_password(
    _length: usize,
    _uppercase: bool,
    _lowercase: bool,
    _numbers: bool,
    _symbols: bool,
) -> Result<String, String> {
    // Boilerplate for now
    Ok(String::new())
}
