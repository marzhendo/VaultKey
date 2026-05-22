use std::sync::Mutex;
use zeroize::Zeroize;

pub struct KeyState(pub Option<[u8; 32]>);

impl Zeroize for KeyState {
    fn zeroize(&mut self) {
        if let Some(ref mut key) = self.0 {
            key.zeroize();
        }
        self.0 = None;
    }
}

pub struct AppState {
    pub key: Mutex<KeyState>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            key: Mutex::new(KeyState(None)),
        }
    }
}
