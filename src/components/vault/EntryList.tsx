import React from "react";
import { useVaultStore } from "../../store/vaultStore";
import { EntryCard } from "./EntryCard";
import { EmptyState } from "../ui/EmptyState";
import { VaultEntry } from "../../types/vault";
import { FolderOpen, Search, Star, Inbox } from "lucide-react";

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
  const isLoading = useVaultStore((state) => state.isLoading);
  const setEntryModalOpen = useVaultStore((state) => state.setEntryModalOpen);
  const setEntryToEdit = useVaultStore((state) => state.setEntryToEdit);

  // Skeleton Loader for initial fetch
  if (isLoading && entries.length === 0) {
    return (
      <div className="entry-list skeleton-list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="entry-card skeleton-card">
            <div className="skeleton-icon skeleton-pulse"></div>
            <div className="skeleton-info">
              <div className="skeleton-title skeleton-pulse"></div>
              <div className="skeleton-username skeleton-pulse"></div>
            </div>
            <div className="skeleton-meta skeleton-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Apply filters
  const filteredEntries = entries.filter((entry) => {
    // 1. Category/Favorite Filter
    if (activeCategory === "Favorites") {
      if (!entry.is_favorite) return false;
    } else if (activeCategory !== null) {
      if (entry.category !== activeCategory) return false;
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      if (
        !entry.title.toLowerCase().includes(query) &&
        !(entry.username && entry.username.toLowerCase().includes(query)) &&
        !(entry.category && entry.category.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    return true;
  });

  const handleAddFirstItem = () => {
    setEntryToEdit(null);
    setEntryModalOpen(true);
  };

  // Calculate dynamic empty state context exactly matching UX specifications
  if (filteredEntries.length === 0) {
    if (entries.length === 0) {
      return (
        <EmptyState
          icon={FolderOpen}
          title="Your vault is empty"
          description="Secure your digital life! Store, generate, and autofill credentials in a completely local, offline space."
          actionLabel="Add your first item"
          onAction={handleAddFirstItem}
        />
      );
    }
    
    if (searchQuery.trim()) {
      return (
        <EmptyState
          icon={Search}
          title="No search results"
          description={`We couldn't find any entries matching "${searchQuery}". Please refine your keywords or search terms.`}
        />
      );
    }
    
    if (activeCategory === "Favorites") {
      return (
        <EmptyState
          icon={Star}
          title="No favorites saved"
          description="Star your most important, high-frequency passwords to locate them in this tab in a single click."
        />
      );
    }
    
    if (activeCategory !== null) {
      return (
        <EmptyState
          icon={Inbox}
          title="No entries here"
          description={`Add credentials to the "${activeCategory}" category by clicking the Add Item button in the upper right corner.`}
        />
      );
    }

    return (
      <EmptyState
        icon={Inbox}
        title="No entries match"
        description="No entries match the currently active navigation filter."
      />
    );
  }

  // Group by category
  const categories = Array.from(new Set(filteredEntries.map((e) => e.category)));

  return (
    <div className="entry-list">
      {categories.map((category) => (
        <section key={category} className="entry-category-section">
          <h4 className="entry-category-header">
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
