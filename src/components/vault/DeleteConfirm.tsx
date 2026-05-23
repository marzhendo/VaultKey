import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useVaultStore } from "../../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";
import { Trash2 } from "lucide-react";

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  isOpen,
  onClose,
}) => {
  const entryToDelete = useVaultStore((state) => state.entryToDelete);
  const refreshEntries = useVaultStore((state) => state.refreshEntries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!entryToDelete || !entryToDelete.id) return;
    setLoading(true);
    setError("");
    try {
      await invoke("delete_entry", { id: entryToDelete.id });
      await refreshEntries();
      onClose();
    } catch (err: any) {
      setError(err?.toString() || "Failed to delete entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Entry"
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "var(--space-2) 0" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "rgba(226, 75, 74, 0.15)",
          color: "var(--color-danger)",
          marginBottom: "var(--space-4)"
        }}>
          <Trash2 size={20} />
        </div>
        
        {error && <div className="setup-error" style={{ marginBottom: "var(--space-3)" }}>{error}</div>}
        
        <h4 style={{ fontSize: "16px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
          Delete entry?
        </h4>
        
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
          This will permanently delete {entryToDelete?.title || "this entry"}. This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
};
