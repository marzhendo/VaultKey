import React from "react";
import { useVaultStore } from "../../store/vaultStore";
import { Plus, KeyRound, Search } from "lucide-react";

export const TopBar: React.FC = () => {
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);
  const setGeneratorOpen = useVaultStore((state) => state.setGeneratorOpen);
  const setEntryModalOpen = useVaultStore((state) => state.setEntryModalOpen);
  const setEntryToEdit = useVaultStore((state) => state.setEntryToEdit);

  const handleAddNewEntry = () => {
    setEntryToEdit(null);
    setEntryModalOpen(true);
  };

  const isLoading = useVaultStore((state) => state.isLoading);

  return (
    <header className="topbar" style={{ position: "relative", overflow: "hidden" }}>
      <div className="topbar-search-container">
        <Search size={14} className="topbar-search-icon" />
        <input
          type="search"
          placeholder="Search vault (Ctrl+F)..."
          className="topbar-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="topbar-actions">
        <button 
          className="icon-btn" 
          title="Password Generator (Ctrl+G)"
          onClick={() => setGeneratorOpen(true)}
        >
          <KeyRound size={16} />
        </button>
        <button 
          className="topbar-btn primary" 
          title="Add New Entry (Ctrl+N)"
          onClick={handleAddNewEntry}
        >
          <Plus size={14} />
          <span>New Entry</span>
        </button>
      </div>
      {isLoading && (
        <div className="topbar-loader-bar">
          <div className="topbar-loader-indicator"></div>
        </div>
      )}
    </header>
  );
};

