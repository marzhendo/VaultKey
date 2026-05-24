import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { toast } from "../../store/toastStore";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { Upload, AlertTriangle, ShieldCheck, Eye, EyeOff, FolderOpen } from "lucide-react";

interface ImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImported }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectFile = async () => {
    try {
      const filePath = await open({
        filters: [{ name: "VaultKey Backup", extensions: ["vaultkey"] }],
        multiple: false,
      });

      if (filePath && typeof filePath === "string") {
        setSelectedFile(filePath);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to open file picker.");
    }
  };

  const getFileName = (fullPath: string) => {
    // Standard Windows/Unix path splitter
    const parts = fullPath.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    if (!password) {
      setErrorMsg("Please enter the master password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await invoke("import_vault", {
        importPath: selectedFile,
        masterPassword: password,
      });

      toast.success("Vault imported successfully!");
      onImported();
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err?.toString() || "Import failed. The backup file may be corrupted.";
      if (msg.toLowerCase().includes("incorrect master password")) {
        setErrorMsg("Incorrect master password for this backup.");
        setPassword(""); // Clear password field on wrong password
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const step1Footer = (
    <div style={{ display: "flex", gap: "var(--space-3)", width: "100%", justifyContent: "flex-end" }}>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onClick={() => setStep(2)} 
        disabled={!selectedFile}
      >
        Continue
      </Button>
    </div>
  );

  const step2Footer = (
    <div style={{ display: "flex", gap: "var(--space-3)", width: "100%", justifyContent: "flex-end" }}>
      <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
        Back
      </Button>
      <Button variant="danger" onClick={handleImport} isLoading={loading}>
        Import vault
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={step === 1 ? "Import Backup" : "Confirm Master Password"}
      footer={step === 1 ? step1Footer : step2Footer}
    >
      {step === 1 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "var(--space-2) 0" }}>
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(226, 75, 74, 0.1)",
              color: "var(--color-danger)",
              marginBottom: "var(--space-4)"
            }}
          >
            <Upload size={24} />
          </div>

          <h4 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
            Restore from backup
          </h4>

          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4, marginBottom: "var(--space-4)" }}>
            Select a .vaultkey backup file to restore your entries.
          </p>

          <div 
            style={{ 
              backgroundColor: "rgba(186, 117, 23, 0.1)", 
              border: "1px solid var(--color-warning)", 
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
            <AlertTriangle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "12px", color: "var(--color-warning)", lineHeight: 1.3 }}>
              Importing will replace ALL current vault entries. Your existing entries will be permanently deleted.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleSelectFile}
            style={{ 
              width: "100%", 
              justifyContent: "center", 
              gap: "var(--space-2)", 
              border: "1px dashed var(--color-border-strong)",
              height: "44px",
              color: selectedFile ? "var(--color-success)" : "var(--color-text-secondary)"
            }}
          >
            <FolderOpen size={16} />
            <span>{selectedFile ? getFileName(selectedFile) : "Choose .vaultkey file"}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "var(--space-2) 0" }}>
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
              marginBottom: "var(--space-4)",
              alignSelf: "center"
            }}
          >
            <ShieldCheck size={24} />
          </div>

          <h4 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "var(--space-2)", textAlign: "center" }}>
            Enter the backup's master password
          </h4>

          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4, marginBottom: "var(--space-4)", textAlign: "center" }}>
            Enter the master password that was used when this backup was created. This may be different from your current master password.
          </p>

          <div className="form-group" style={{ width: "100%" }}>
            <label className="input-label">Backup Master Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImport();
                  }
                }}
                placeholder="Enter master password"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errorMsg && (
              <span className="login-error" style={{ display: "block", marginTop: "var(--space-1)" }}>
                {errorMsg}
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
