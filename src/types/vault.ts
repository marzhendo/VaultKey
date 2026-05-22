export interface VaultEntry {
  id?: number;
  category: string;
  title: string;
  ciphertext: number[];
  nonce: number[];
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DecryptedPayload {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}
