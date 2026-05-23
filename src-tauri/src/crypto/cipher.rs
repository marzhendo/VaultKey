use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;

/// Encrypt plaintext bytes with the given 32-byte key.
/// Generates a fresh 12-byte nonce on every call — never reuse.
/// Returns (ciphertext, nonce) — both must be stored.
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| format!("Encryption init failed: {}", e))?;
    
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes); // fresh nonce every time
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    Ok((ciphertext, nonce_bytes))
}

/// Decrypt ciphertext bytes with the given key and nonce.
/// Returns plaintext bytes on success.
pub fn decrypt(key: &[u8; 32], ciphertext: &[u8], nonce: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| "Decryption failed".to_string())?;
    
    if nonce.len() != 12 {
        return Err("Decryption failed".to_string());
    }
    let nonce = Nonce::from_slice(nonce);
    
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption failed".to_string())
}
