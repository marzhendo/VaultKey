import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

import { useVaultStore } from "../../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { PasswordGenerator } from "./PasswordGenerator";

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
  const [category, setCategory] = useState("Default");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showInlineGenerator, setShowInlineGenerator] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadDetails = async () => {
      if (entryToEdit && entryToEdit.id) {
        setLoading(true);
        setError("");
        try {
          const detail = await invoke<any>("get_entry_detail", { id: entryToEdit.id });
          setTitle(detail.title || "");
          setCategory(detail.category || "Default");
          setUsername(detail.username || "");
          setPassword(detail.password || "");
          setUrl(detail.url || "");
          setNotes(detail.notes || "");
        } catch (err: any) {
          setError(err?.toString() || "Failed to load entry details.");
        } finally {
          setLoading(false);
        }
      } else {
        setTitle("");
        setCategory("Default");
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
  }, [entryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError("Title is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (entryToEdit && entryToEdit.id) {
        await invoke("update_entry", {
          id: entryToEdit.id,
          category,
          title,
          username: username || null,
          password: password || null,
          url: url || null,
          notes: notes || null,
        });
      } else {
        await invoke("add_entry", {
          category,
          title,
          username: username || null,
          password: password || null,
          url: url || null,
          notes: notes || null,
        });
      }
      await refreshEntries();
      onClose();
    } catch (err: any) {
      setError(err?.toString() || "Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Vault Entry" : "Add New Vault Entry"}
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !title}>
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      }
    >
      {loading && !password ? (
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
              <option value="Default">Default</option>
            </select>
          </div>

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Google Account"
            required
          />

          <Input
            label="Username / Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username or email address..."
          />

          <div className="password-input-wrapper">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password..."
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
            placeholder="https://example.com"
          />

          <div className="form-group">
            <label className="input-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field textarea-field"
              rows={3}
              placeholder="Add extra notes here..."
            />
          </div>
        </form>
      )}
    </Modal>
  );
};

