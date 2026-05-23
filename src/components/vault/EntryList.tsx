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
    // 1. Category Filter
    const matchesCategory =
      activeCategory === null ||
      (activeCategory === "Favorites" && entry.is_favorite) ||
      entry.category === activeCategory;

    // 2. Search Filter
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      entry.title.toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query) ||
      (entry.username && entry.username.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  // Calculate dynamic empty state message
  if (filteredEntries.length === 0) {
    let emptyMessage = "No vault items found. Get started by adding a new one.";
    
    if (searchQuery.trim()) {
      emptyMessage = `No matching items found for "${searchQuery}".`;
    } else if (activeCategory === "Favorites") {
      emptyMessage = "No favorite items found. Star an item to add it here.";
    } else if (activeCategory) {
      emptyMessage = `No items in category "${activeCategory}".`;
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
      {categories.map((category) => (
        <section key={category} className="entry-category-section">
          <h4 className="entry-category-header">{category}</h4>
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

