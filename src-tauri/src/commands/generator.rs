use rand::Rng;

fn uniform_sample_char(set: &[u8]) -> u8 {
    let mut rng = rand::thread_rng();
    let limit = set.len();
    let max = 256 - (256 % limit);
    loop {
        let r = rng.gen::<u8>() as usize;
        if r < max {
            return set[r % limit];
        }
    }
}

#[tauri::command]
pub fn generate_password(
    length: usize,
    uppercase: bool,
    lowercase: bool,
    numbers: bool,
    symbols: bool,
) -> Result<String, String> {
    // 1. Clamp length to 8–64 inclusive
    let length = std::cmp::max(8, std::cmp::min(64, length));

    // 2. Enforce at least one charset is enabled
    if !uppercase && !lowercase && !numbers && !symbols {
        return Err("Please select at least one character set".to_string());
    }

    let uppercase_set = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowercase_set = b"abcdefghijklmnopqrstuvwxyz";
    let numbers_set = b"0123456789";
    let symbols_set = b"!@#$%^&*()-_=+[]{}|;:,.<>?";

    let mut result = Vec::with_capacity(length);
    let mut combined_charset = Vec::new();

    // 3. Guarantee at least 1 character from each enabled set
    if uppercase {
        result.push(uniform_sample_char(uppercase_set));
        combined_charset.extend_from_slice(uppercase_set);
    }
    if lowercase {
        result.push(uniform_sample_char(lowercase_set));
        combined_charset.extend_from_slice(lowercase_set);
    }
    if numbers {
        result.push(uniform_sample_char(numbers_set));
        combined_charset.extend_from_slice(numbers_set);
    }
    if symbols {
        result.push(uniform_sample_char(symbols_set));
        combined_charset.extend_from_slice(symbols_set);
    }

    // 4. Fill the remaining length with uniform samples from combined charset
    while result.len() < length {
        result.push(uniform_sample_char(&combined_charset));
    }

    // 5. Shuffle result using Fisher-Yates with rand::thread_rng()
    let mut rng = rand::thread_rng();
    let n = result.len();
    for i in (1..n).rev() {
        let j = rng.gen_range(0..=i);
        result.swap(i, j);
    }

    String::from_utf8(result).map_err(|e| format!("Failed to build password string: {}", e))
}

