import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useVaultStore } from "../../store/vaultStore";
import { toast } from "../../store/toastStore";
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

  const handleDelete = async () => {
    if (!entryToDelete || !entryToDelete.id) return;
    setLoading(true);
    try {
      await invoke("delete_entry", { id: entryToDelete.id });
      await refreshEntries();
      toast.success(`Deleted ${entryToDelete.title}`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete entry.");
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
          <Button variant="danger" onClick={handleDelete} isLoading={loading}>
            Delete
          </Button>
        </div>
      }
    >
      <div className="confirm-modal-body">
        <div className="confirm-modal-icon">
          <Trash2 size={20} />
        </div>
        
        <h4 className="confirm-modal-title">
          Delete entry?
        </h4>
        
        <p className="confirm-modal-desc">
          This will permanently delete {entryToDelete?.title || "this entry"}. This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
};
