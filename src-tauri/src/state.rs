use std::sync::Mutex;
use rusqlite::Connection;
use zeroize::Zeroize;

pub struct EncryptionKey(pub [u8; 32]);

impl Drop for EncryptionKey {
    fn drop(&mut self) {
        self.0.zeroize(); // secure wipe from memory when dropped
    }
}

pub struct AppState {
    pub db: Mutex<Connection>,
    pub encryption_key: Mutex<Option<EncryptionKey>>,
}

impl AppState {
    pub fn new(conn: Connection) -> Self {
        Self {
            db: Mutex::new(conn),
            encryption_key: Mutex::new(None),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        if let Ok(key_guard) = self.encryption_key.lock() {
            key_guard.is_some()
        } else {
            false
        }
    }
}

