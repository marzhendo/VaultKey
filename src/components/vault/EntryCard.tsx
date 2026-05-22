import React from "react";
import { VaultEntry } from "../../types/vault";
import { Copy, Edit, Trash2 } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard";

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

  const style = getCategoryStyles(entry.category);

  return (
    <div className="entry-card">
      <div
        className="entry-icon"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {entry.category.charAt(0).toUpperCase()}
      </div>
      <div className="entry-info">
        <div className="entry-title">{entry.title}</div>
        <div className="entry-category-name">{entry.category}</div>
      </div>
      <div className="entry-password-preview">••••••••</div>
      <div className="entry-actions">
        <button
          className="entry-action-btn"
          onClick={() => copy("password")}
          title="Copy Password"
        >
          <Copy size={14} />
        </button>
        <button className="entry-action-btn" onClick={onEdit} title="Edit">
          <Edit size={14} />
        </button>
        <button
          className="entry-action-btn danger"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
