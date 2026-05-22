import React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { VaultEntry } from "../../types/vault";

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry?: VaultEntry | null;
}

export const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entry,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Entry"
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      }
    >
      <p>Are you sure you want to delete the entry "{entry?.title}"?</p>
      <p style={{ color: "var(--color-danger)", marginTop: "8px" }}>
        This action cannot be undone.
      </p>
    </Modal>
  );
};
