import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useVaultStore } from "../../store/vaultStore";
import { toast } from "../../store/toastStore";
import { invoke } from "@tauri-apps/api/tauri";
import { save } from "@tauri-apps/api/dialog";
import { Download, Info } from "lucide-react";

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const entries = useVaultStore((state) => state.entries);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      const filePath = await save({
        defaultPath: "vaultkey-backup.vaultkey",
        filters: [{ name: "VaultKey Backup", extensions: ["vaultkey"] }],
      });

      if (!filePath) return;

      setLoading(true);
      await invoke("export_vault", { exportPath: filePath });
      toast.success("Vault exported successfully!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.toString() || "Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Export Vault"
      footer={
        <div style={{ display: "flex", gap: "var(--space-3)", width: "100%", justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} isLoading={loading}>
            Export .vaultkey file
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "var(--space-2) 0" }}>
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--color-brand-subtle)",
            color: "var(--color-brand)",
            marginBottom: "var(--space-4)"
          }}
        >
          <Download size={24} />
        </div>

        <h4 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
          Back up your vault
        </h4>

        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4, marginBottom: "var(--space-4)" }}>
          Export an encrypted backup of all your vault entries. The backup is protected by your current master password. Store it somewhere safe — Google Drive, USB drive, or cloud storage.
        </p>

        <div 
          style={{ 
            backgroundColor: "var(--color-brand-subtle)", 
            border: "1px solid var(--color-brand-border)", 
            padding: "var(--space-3)", 
            borderRadius: "var(--radius-md)", 
            display: "flex", 
            gap: "var(--space-2)", 
            alignItems: "flex-start", 
            textAlign: "left",
            width: "100%",
            marginBottom: "var(--space-4)" 
          }}
        >
          <Info size={16} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: "2px" }} />
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.3 }}>
            Your backup file is encrypted. Anyone who finds it still needs your master password to read it.
          </span>
        </div>

        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          Your vault contains {entries.length} {entries.length === 1 ? "entry" : "entries"}.
        </span>
      </div>
    </Modal>
  );
};
