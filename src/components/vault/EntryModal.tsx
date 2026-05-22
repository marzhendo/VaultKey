import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { VaultEntry } from "../../types/vault";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<VaultEntry>) => void;
  entryToEdit?: VaultEntry | null;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entryToEdit,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Default");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entryToEdit) {
      setTitle(entryToEdit.title);
      setCategory(entryToEdit.category);
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
    } else {
      setTitle("");
      setCategory("Default");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
    }
  }, [entryToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: entryToEdit?.id,
      title,
      category,
      isFavorite: entryToEdit?.isFavorite || false,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Vault Entry" : "Add New Vault Entry"}
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Entry
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="entry-form">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
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
          label="Username / Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="form-group">
          <label className="input-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field textarea-field"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
};
