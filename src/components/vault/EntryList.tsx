import React from "react";
import { VaultEntry } from "../../types/vault";
import { EntryCard } from "./EntryCard";

interface EntryListProps {
  entries: VaultEntry[];
  onEditEntry: (entry: VaultEntry) => void;
  onDeleteEntry: (entry: VaultEntry) => void;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
}) => {
  if (entries.length === 0) {
    return (
      <div className="entry-list-empty">
        <p>No vault items found. Get started by adding a new one.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(entries.map((e) => e.category)));

  return (
    <div className="entry-list">
      {categories.map((category) => (
        <section key={category} className="entry-category-section">
          <h4 className="entry-category-header">{category}</h4>
          <div className="entry-category-items">
            {entries
              .filter((e) => e.category === category)
              .map((entry) => (
                <EntryCard
                  key={entry.id || entry.title}
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
