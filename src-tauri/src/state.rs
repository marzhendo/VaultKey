use std::sync::Mutex;
use zeroize::Zeroize;
use crate::commands::entries::VaultEntryDetail;

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
    pub db: Mutex<Vec<VaultEntryDetail>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            key: Mutex::new(KeyState(None)),
            db: Mutex::new(vec![
                VaultEntryDetail {
                    id: 1,
                    category: "Google".to_string(),
                    title: "Google Account".to_string(),
                    username: Some("user@gmail.com".to_string()),
                    password: Some("google_pass_123".to_string()),
                    url: Some("https://google.com".to_string()),
                    notes: Some("Personal account".to_string()),
                    is_favorite: false,
                },
                VaultEntryDetail {
                    id: 2,
                    category: "Campus".to_string(),
                    title: "Campus WiFi".to_string(),
                    username: Some("student_id".to_string()),
                    password: Some("campus_wifi_secret".to_string()),
                    url: None,
                    notes: Some("WiFi login details for eduroam".to_string()),
                    is_favorite: true,
                },
            ]),
        }
    }
}

