use rand::seq::SliceRandom;
use rand::thread_rng;

#[tauri::command]
pub fn generate_password(
    length: usize,
    uppercase: bool,
    lowercase: bool,
    numbers: bool,
    symbols: bool,
) -> Result<String, String> {
    let mut chars = Vec::new();
    if uppercase {
        chars.extend_from_slice(b"ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if lowercase {
        chars.extend_from_slice(b"abcdefghijklmnopqrstuvwxyz");
    }
    if numbers {
        chars.extend_from_slice(b"0123456789");
    }
    if symbols {
        chars.extend_from_slice(b"!@#$%^&*()_+-=[]{}|;:,.<>?");
    }

    if chars.is_empty() {
        return Err("No character sets selected".to_string());
    }

    let mut rng = thread_rng();
    let mut password = String::new();
    for _ in 0..length {
        let &c = chars.choose(&mut rng).ok_or("Failed to select random character")?;
        password.push(c as char);
    }
    Ok(password)
}

