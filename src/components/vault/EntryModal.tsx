import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useVaultStore } from "../../store/vaultStore";
import { VaultEntryDetail } from "../../types/vault";
import { invoke } from "@tauri-apps/api/tauri";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { PasswordGenerator } from "./PasswordGenerator";
import { toast } from "../../store/toastStore";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const entryToEdit = useVaultStore((state) => state.entryToEdit);
  const refreshEntries = useVaultStore((state) => state.refreshEntries);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Campus");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showInlineGenerator, setShowInlineGenerator] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditMode = !!entryToEdit;

  useEffect(() => {
    if (!isOpen) return;

    const loadDetails = async () => {
      if (isEditMode && entryToEdit.id) {
        setLoading(true);
        setError("");
        try {
          const detail = await invoke<VaultEntryDetail>("get_entry_detail", { id: entryToEdit.id });
          setTitle(detail.title || "");
          setCategory(detail.category || "Campus");
          setUsername(detail.username || "");
          // Keep password state empty to avoid storing decrypted password in memory/JS state
          setPassword("");
          setUrl(detail.url || "");
          setNotes(detail.notes || "");
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setError("Failed to load details. Please unlock your vault or try again.");
          console.error(message);
        } finally {
          setLoading(false);
        }
      } else {
        setTitle("");
        setCategory("Campus");
        setUsername("");
        setPassword("");
        setUrl("");
        setNotes("");
        setError("");
        setLoading(false);
      }
      setShowPassword(false);
      setShowInlineGenerator(false);
    };

    loadDetails();
  }, [entryToEdit, isOpen, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEditMode && entryToEdit.id) {
        // Secure Password Saving Logic:
        // If the password field is left empty (meaning unchanged from placeholder), fetch it on-demand
        let finalPassword = password;
        if (!finalPassword) {
          finalPassword = await invoke<string>("get_entry_password", { id: entryToEdit.id });
        }

        await invoke("update_entry", {
          id: entryToEdit.id,
          category,
          title,
          username: username.trim() || null,
          password: finalPassword || null,
          url: url.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await invoke("add_entry", {
          category,
          title,
          username: username.trim() || null,
          password: password || null,
          url: url.trim() || null,
          notes: notes.trim() || null,
        });
      }
      await refreshEntries();
      toast.success(isEditMode ? "Entry updated successfully!" : "Entry created successfully!");
      onClose();
    } catch (err) {
      // Map raw Rust errors to friendly messages
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("Vault is locked")) {
        toast.error("Your vault session has expired. Please unlock the vault again.");
      } else if (errMsg.includes("Database")) {
        toast.error("A database error occurred. Please try again.");
      } else {
        toast.error("Failed to save entry. Please try again.");
      }
      console.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Entry" : "Add Entry"}
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={!title.trim()}>
            Save Entry
          </Button>
        </div>
      }
    >
      {loading && password === "••••••••" ? (
        <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-text-secondary)" }}>
          Loading entry details...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="entry-form">
          {error && <div className="setup-error" style={{ marginBottom: "var(--space-3)" }}>{error}</div>}
          
          <div className="form-group">
            <label className="input-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field select-field"
            >
              <option value="Campus">Campus</option>
              <option value="Google">Google</option>
              <option value="Social Media">Social Media</option>
              <option value="Finance">Finance</option>
              <option value="Dev Tools">Dev Tools</option>
              <option value="Other">Other</option>
              <option value="Default">Default</option>
            </select>
          </div>

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Gmail Work Account"
            required
          />

          <Input
            label="Username / Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username or email"
          />

          <div className="password-input-wrapper">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditMode ? "••••••••" : "Password..."}
            />
            <button 
              type="button" 
              className="password-toggle-btn"
              style={{ top: "30px" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button 
            type="button" 
            className="generate-link-btn"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
            onClick={() => setShowInlineGenerator(!showInlineGenerator)}
          >
            <Sparkles size={12} />
            <span>{showInlineGenerator ? "Hide Generator" : "Generate Password"}</span>
          </button>

          {showInlineGenerator && (
            <div className="inline-generator-wrapper">
              <div className="inline-generator-title">Generate Password</div>
              <PasswordGenerator 
                mode="inline" 
                onSelect={(genPassword) => {
                  setPassword(genPassword);
                  setShowInlineGenerator(false);
                }}
              />
            </div>
          )}

          <Input
            label="Website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
          />

          <div className="form-group">
            <label className="input-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field textarea-field"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
