import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { EntryList } from "../components/vault/EntryList";
import { EntryModal } from "../components/vault/EntryModal";
import { DeleteConfirm } from "../components/vault/DeleteConfirm";
import { PasswordGenerator } from "../components/vault/PasswordGenerator";
import { LockOverlay } from "../components/vault/LockOverlay";
import { ExportModal } from "../components/vault/ExportModal";
import { ImportModal } from "../components/vault/ImportModal";
import { useVaultStore } from "../store/vaultStore";

export const DashboardPage: React.FC = () => {
  const isLocked = useVaultStore((state) => state.isLocked);
  const isEntryModalOpen = useVaultStore((state) => state.isEntryModalOpen);
  const setEntryModalOpen = useVaultStore((state) => state.setEntryModalOpen);
  
  const isDeleteModalOpen = useVaultStore((state) => state.isDeleteModalOpen);
  const setDeleteModalOpen = useVaultStore((state) => state.setDeleteModalOpen);

  const setEntryToEdit = useVaultStore((state) => state.setEntryToEdit);
  const setEntryToDelete = useVaultStore((state) => state.setEntryToDelete);
  const refreshEntries = useVaultStore((state) => state.refreshEntries);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Load entries on mount
  useEffect(() => {
    if (!isLocked) {
      refreshEntries();
    }
  }, [refreshEntries, isLocked]);

  return (
    <AppShell
      onExportClick={() => setShowExportModal(true)}
      onImportClick={() => setShowImportModal(true)}
    >
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

        <PasswordGenerator />

        {showExportModal && (
          <ExportModal onClose={() => setShowExportModal(false)} />
        )}

        {showImportModal && (
          <ImportModal 
            onClose={() => setShowImportModal(false)} 
            onImported={refreshEntries} 
          />
        )}
        
        {isLocked && <LockOverlay />}
      </div>
    </AppShell>
  );
};

export default DashboardPage;
