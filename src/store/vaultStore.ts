import { create } from "zustand";
import { VaultEntry } from "../types/vault";
import { invoke } from "@tauri-apps/api/tauri";

interface VaultStore {
  isLocked: boolean;
  isFirstLaunch: boolean;
  activeCategory: string | null;
  searchQuery: string;
  selectedEntryId: number | null;
  entries: VaultEntry[];
  lockWarning: boolean;
  statusMessage: string | null;
  
  // Loading & Theme States
  isLoading: boolean;
  loadingMessage: string | null;
  theme: "light" | "dark";
  
  // UI Modal States
  isGeneratorOpen: boolean;
  isEntryModalOpen: boolean;
  isDeleteModalOpen: boolean;
  entryToEdit: VaultEntry | null;
  entryToDelete: VaultEntry | null;

  setLocked: (locked: boolean) => void;
  setFirstLaunch: (firstLaunch: boolean) => void;
  setEntries: (entries: VaultEntry[]) => void;
  setActiveCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedEntryId: (id: number | null) => void;
  setLockWarning: (warning: boolean) => void;
  setStatusMessage: (msg: string | null) => void;
  
  // Loading & Theme Setters
  setLoading: (loading: boolean, message?: string | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  
  // UI Modal Setters
  setGeneratorOpen: (isOpen: boolean) => void;
  setEntryModalOpen: (isOpen: boolean) => void;
  setDeleteModalOpen: (isOpen: boolean) => void;
  setEntryToEdit: (entry: VaultEntry | null) => void;
  setEntryToDelete: (entry: VaultEntry | null) => void;
  refreshEntries: () => Promise<void>;
}

export const useVaultStore = create<VaultStore>((set) => ({
  isLocked: true,
  isFirstLaunch: false,
  activeCategory: null,
  searchQuery: "",
  selectedEntryId: null,
  entries: [],
  lockWarning: false,
  statusMessage: null,
  
  isLoading: false,
  loadingMessage: null,
  theme: "light",
  
  isGeneratorOpen: false,
  isEntryModalOpen: false,
  isDeleteModalOpen: false,
  entryToEdit: null,
  entryToDelete: null,

  setLocked: (locked) => set({ isLocked: locked }),
  setFirstLaunch: (firstLaunch) => set({ isFirstLaunch: firstLaunch }),
  setEntries: (entries) => set({ entries }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedEntryId: (id) => set({ selectedEntryId: id }),
  setLockWarning: (warning) => set({ lockWarning: warning }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  
  setLoading: (isLoading, loadingMessage = null) => set({ isLoading, loadingMessage }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  
  setGeneratorOpen: (isGeneratorOpen) => set({ isGeneratorOpen }),
  setEntryModalOpen: (isEntryModalOpen) => set({ isEntryModalOpen }),
  setDeleteModalOpen: (isDeleteModalOpen) => set({ isDeleteModalOpen }),
  setEntryToEdit: (entryToEdit) => set({ entryToEdit }),
  setEntryToDelete: (entryToDelete) => set({ entryToDelete }),
  
  refreshEntries: async () => {
    set({ isLoading: true, loadingMessage: "Loading vault entries..." });
    try {
      const data = await invoke<VaultEntry[]>("get_entries");
      set({ entries: data });
    } catch (err) {
      console.error("Failed to refresh entries:", err);
    } finally {
      set({ isLoading: false, loadingMessage: null });
    }
  },
}));



