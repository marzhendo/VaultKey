import { create } from "zustand";

interface VaultState {
  isLocked: boolean;
  selectedCategory: string;
  searchQuery: string;
  setLocked: (locked: boolean) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  isLocked: true,
  selectedCategory: "All",
  searchQuery: "",
  setLocked: (locked) => set({ isLocked: locked }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
