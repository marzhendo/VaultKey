import React, { useEffect } from "react";
import { AppShell } from "../components/layout/AppShell";
import { EntryList } from "../components/vault/EntryList";
import { EntryModal } from "../components/vault/EntryModal";
import { DeleteConfirm } from "../components/vault/DeleteConfirm";
import { PasswordGenerator } from "../components/vault/PasswordGenerator";
import { useVaultStore } from "../store/vaultStore";

export const DashboardPage: React.FC = () => {
  const isEntryModalOpen = useVaultStore((state) => state.isEntryModalOpen);
  const setEntryModalOpen = useVaultStore((state) => state.setEntryModalOpen);
  
  const isDeleteModalOpen = useVaultStore((state) => state.isDeleteModalOpen);
  const setDeleteModalOpen = useVaultStore((state) => state.setDeleteModalOpen);

  const isGeneratorOpen = useVaultStore((state) => state.isGeneratorOpen);

  const setEntryToEdit = useVaultStore((state) => state.setEntryToEdit);
  const setEntryToDelete = useVaultStore((state) => state.setEntryToDelete);
  const refreshEntries = useVaultStore((state) => state.refreshEntries);

  // Load entries on mount
  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  return (
    <AppShell>
      <div className="dashboard-page">
        <EntryList
          onEditEntry={(entry) => {
            setEntryToEdit(entry);
            setEntryModalOpen(true);
          }}
          onDeleteEntry={(entry) => {
            setEntryToDelete(entry);
            setDeleteModalOpen(true);
          }}
        />

        <EntryModal
          isOpen={isEntryModalOpen}
          onClose={() => {
            setEntryModalOpen(false);
            setEntryToEdit(null);
          }}
        />

        <DeleteConfirm
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setEntryToDelete(null);
          }}
        />

        {isGeneratorOpen && (
          <PasswordGenerator />
        )}
      </div>
    </AppShell>
  );
};

export default DashboardPage;
