import React, { useState } from "react";
import { VaultEntry } from "../../types/vault";
import { 
  School, Globe, Users, CreditCard, Terminal, Key,
  Copy, Edit, Trash2, Star, Check, Lock
} from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard";
import { useVaultStore } from "../../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";

interface EntryCardProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
}) => {
  const { copy } = useClipboard();
  const refreshEntries = useVaultStore((state) => state.refreshEntries);
  const selectedEntryId = useVaultStore((state) => state.selectedEntryId);
  const setSelectedEntryId = useVaultStore((state) => state.setSelectedEntryId);

  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const isSelected = selectedEntryId === entry.id;

  const handleCopyUsername = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.username) return;
    const success = await copy(entry.username);
    if (success) {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 1500);
    }
  };

  const handleCopyPassword = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const password = await invoke<string>("get_entry_password", { id: entry.id });
      const success = await copy(password);
      if (success) {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 1500);
      }
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("toggle_favorite", { id: entry.id });
      await refreshEntries();
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "Campus":
        return { bg: "#E8F0FE", color: "#1A73E8" };
      case "Google":
        return { bg: "#FCE8E8", color: "#C5221F" };
      case "Social Media":
        return { bg: "#F3E8FD", color: "#8430CE" };
      case "Finance":
        return { bg: "#E8F5E9", color: "#1D9E75" };
      case "Dev Tools":
        return { bg: "#F0F0F0", color: "#3C3C3C" };
      default:
        return {
          bg: "var(--color-bg-tertiary)",
          color: "var(--color-text-secondary)",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Campus": return <School size={16} />;
      case "Google": return <Globe size={16} />;
      case "Social Media": return <Users size={16} />;
      case "Finance": return <CreditCard size={16} />;
      case "Dev Tools": return <Terminal size={16} />;
      default: return <Key size={16} />;
    }
  };

  const style = getCategoryStyles(entry.category);

  return (
    <div 
      className={`entry-card ${isSelected ? "selected" : ""}`}
      onClick={() => setSelectedEntryId(entry.id || null)}
    >
      <button 
        className={`entry-favorite-btn ${entry.is_favorite ? "favorite" : ""}`}
        onClick={handleToggleFavorite}
        title={entry.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        <Star size={14} fill={entry.is_favorite ? "var(--color-warning)" : "transparent"} />
      </button>

      <div
        className="entry-icon"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {getCategoryIcon(entry.category)}
      </div>

      <div className="entry-info">
        <div className="entry-title">{entry.title}</div>
        <div className="entry-username">{entry.username || "No username"}</div>
      </div>

      <div className="entry-password-preview">••••••••</div>

      <div className="entry-actions">
        {entry.username && (
          <button
            className="entry-action-btn"
            onClick={handleCopyUsername}
            title="Copy Username"
          >
            {copiedUser ? <Check size={14} className="copied" /> : <Copy size={14} />}
          </button>
        )}
        <button
          className="entry-action-btn"
          onClick={handleCopyPassword}
          title="Copy Password"
        >
          {copiedPass ? <Check size={14} className="copied" /> : <Lock size={14} />}
        </button>
        <button 
          className="entry-action-btn" 
          onClick={(e) => { e.stopPropagation(); onEdit(); }} 
          title="Edit"
        >
          <Edit size={14} />
        </button>
        <button
          className="entry-action-btn danger"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

