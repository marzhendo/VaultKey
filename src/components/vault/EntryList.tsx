import React from "react";
import { useVaultStore } from "../../store/vaultStore";
import { EntryCard } from "./EntryCard";
import { VaultEntry } from "../../types/vault";

interface EntryListProps {
  onEditEntry: (entry: VaultEntry) => void;
  onDeleteEntry: (entry: VaultEntry) => void;
}

export const EntryList: React.FC<EntryListProps> = ({
  onEditEntry,
  onDeleteEntry,
}) => {
  const entries = useVaultStore((state) => state.entries);
  const activeCategory = useVaultStore((state) => state.activeCategory);
  const searchQuery = useVaultStore((state) => state.searchQuery);

  // Apply filters
  const filteredEntries = entries.filter((entry) => {
    // 1. Category/Favorite Filter
    if (activeCategory === "Favorites") {
      if (!entry.is_favorite) return false;
    } else if (activeCategory !== null) {
      if (entry.category !== activeCategory) return false;
    }

    // 2. Search Filter (title.toLowerCase().includes(query))
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      if (!entry.title.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Calculate dynamic empty state message exactly matching specifications
  if (filteredEntries.length === 0) {
    let emptyMessage = "No entries match your filters.";
    if (entries.length === 0) {
      emptyMessage = "Your vault is empty. Add your first entry with + Add item.";
    } else if (searchQuery.trim()) {
      emptyMessage = `No entries match "${searchQuery}".`;
    } else if (activeCategory === "Favorites") {
      emptyMessage = "Star an entry to save it here.";
    } else if (activeCategory !== null) {
      emptyMessage = "No entries in this category yet.";
    }

    return (
      <div className="entry-list-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Group by category
  const categories = Array.from(new Set(filteredEntries.map((e) => e.category)));

  return (
    <div className="entry-list">
      {categories.map((category, index) => (
        <section 
          key={category} 
          className="entry-category-section"
          style={{ marginTop: index > 0 ? "var(--space-4)" : "0" }}
        >
          <h4 
            className="entry-category-header"
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--space-2)"
            }}
          >
            {category}
          </h4>
          <div className="entry-category-items">
            {filteredEntries
              .filter((e) => e.category === category)
              .map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => onEditEntry(entry)}
                  onDelete={() => onDeleteEntry(entry)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};
