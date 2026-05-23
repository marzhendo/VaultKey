use argon2::{Argon2, Algorithm, Version, Params};
use rand::RngCore;

/// Generate a new random 16-byte salt.
/// Called once during setup_vault — never again for the same user.
pub fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    salt
}

/// Derive a 32-byte encryption key from master_password + salt.
/// Parameters are fixed — never accept them as arguments.
/// time_cost=3, mem_cost=65536 (64MB), parallelism=1, output_len=32
pub fn derive_key(master_password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let params = Params::new(65536, 3, 1, Some(32))
        .map_err(|e| format!("Argon2 params error: {}", e))?;
    
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(master_password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Key derivation failed: {}", e))?;
    
    Ok(key)
}
