use rusqlite::{Connection, Result};

pub fn init_db(conn: &Connection) -> Result<()> {
    // Create users table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );",
        [],
    )?;

    // Create kdf_params table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS kdf_params (
            user_id     INTEGER PRIMARY KEY REFERENCES users(id),
            salt        BLOB NOT NULL,
            time_cost   INTEGER NOT NULL DEFAULT 3,
            mem_cost    INTEGER NOT NULL DEFAULT 65536,
            parallelism INTEGER NOT NULL DEFAULT 1
        );",
        [],
    )?;

    // Create vault_entries table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS vault_entries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            category    TEXT NOT NULL DEFAULT 'Default',
            title       TEXT NOT NULL,
            ciphertext  BLOB NOT NULL,
            nonce       BLOB NOT NULL,
            is_favorite INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );",
        [],
    )?;

    Ok(())
}
