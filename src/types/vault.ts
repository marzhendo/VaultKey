export interface VaultEntry {
  id?: number;
  category: string;
  title: string;
  is_favorite: boolean;
  username?: string;
  created_at?: string;
  updated_at?: string;
}


export interface DecryptedPayload {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

