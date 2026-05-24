import React from "react";
import { VaultEntry } from "../../types/vault";
import { 
  GraduationCap, Globe, Users, CreditCard, Terminal, Key,
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
  const { copy: copyUsername, copied: copiedUser } = useClipboard();
  const { copy: copyPassword, copied: copiedPass } = useClipboard();
  const refreshEntries = useVaultStore((state) => state.refreshEntries);
  const selectedEntryId = useVaultStore((state) => state.selectedEntryId);
  const setSelectedEntryId = useVaultStore((state) => state.setSelectedEntryId);

  const isSelected = selectedEntryId === entry.id;

  const handleCopyUsername = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.username) return;
    await copyUsername(entry.username);
  };

  const handleCopyPassword = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.id) return;
    try {
      const password = await invoke<string>("get_entry_password", { id: entry.id });
      await copyPassword(password);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.id) return;
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
        return { bg: "var(--color-category-campus-bg)", color: "var(--color-category-campus-fg)" };
      case "Google":
        return { bg: "var(--color-category-google-bg)", color: "var(--color-category-google-fg)" };
      case "Social Media":
        return { bg: "var(--color-category-social-bg)", color: "var(--color-category-social-fg)" };
      case "Finance":
        return { bg: "var(--color-category-finance-bg)", color: "var(--color-category-finance-fg)" };
      case "Dev Tools":
        return { bg: "var(--color-category-devtools-bg)", color: "var(--color-category-devtools-fg)" };
      default:
        return {
          bg: "var(--color-bg-tertiary)",
          color: "var(--color-text-secondary)",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Campus": return <GraduationCap size={16} />;
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
            {copiedUser ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Copy size={14} />}
          </button>
        )}
        <button
          className="entry-action-btn"
          onClick={handleCopyPassword}
          title="Copy Password"
        >
          {copiedPass ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Lock size={14} />}
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
