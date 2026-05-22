import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { EntryList } from "../components/vault/EntryList";
import { EntryModal } from "../components/vault/EntryModal";
import { DeleteConfirm } from "../components/vault/DeleteConfirm";
import { PasswordGenerator } from "../components/vault/PasswordGenerator";
import { VaultEntry } from "../types/vault";
import { useVaultStore } from "../store/vaultStore";

export const DashboardPage: React.FC = () => {
  const selectedCategory = useVaultStore((state) => state.selectedCategory);
  const searchQuery = useVaultStore((state) => state.searchQuery);

  const [entries, setEntries] = useState<VaultEntry[]>([
    {
      id: 1,
      title: "Google Account",
      category: "Google",
      ciphertext: [],
      nonce: [],
      isFavorite: false,
    },
    {
      id: 2,
      title: "Campus WiFi",
      category: "Campus",
      ciphertext: [],
      nonce: [],
      isFavorite: true,
    },
  ]);

  const [entryToEdit, setEntryToEdit] = useState<VaultEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<VaultEntry | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (selectedCategory === "Favorites" && entry.isFavorite) ||
      entry.category === selectedCategory;

    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleSaveEntry = (partialEntry: Partial<VaultEntry>) => {
    if (partialEntry.id) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === partialEntry.id ? ({ ...e, ...partialEntry } as VaultEntry) : e
        )
      );
    } else {
      const newEntry: VaultEntry = {
        id: Date.now(),
        title: partialEntry.title || "Untitled",
        category: partialEntry.category || "Default",
        ciphertext: [],
        nonce: [],
        isFavorite: false,
      };
      setEntries((prev) => [...prev, newEntry]);
    }
    setIsEntryModalOpen(false);
    setEntryToEdit(null);
  };

  const handleDeleteConfirm = () => {
    if (entryToDelete) {
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <AppShell>
      <div className="dashboard-page">
        <EntryList
          entries={filteredEntries}
          onEditEntry={(entry) => {
            setEntryToEdit(entry);
            setIsEntryModalOpen(true);
          }}
          onDeleteEntry={(entry) => {
            setEntryToDelete(entry);
            setIsDeleteModalOpen(true);
          }}
        />

        <EntryModal
          isOpen={isEntryModalOpen}
          onClose={() => {
            setIsEntryModalOpen(false);
            setEntryToEdit(null);
          }}
          onSave={handleSaveEntry}
          entryToEdit={entryToEdit}
        />

        <DeleteConfirm
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setEntryToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          entry={entryToDelete}
        />

        <PasswordGenerator
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
        />
      </div>
    </AppShell>
  );
};

export default DashboardPage;
