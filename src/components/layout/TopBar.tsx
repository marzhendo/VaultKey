import React from "react";
import { useVaultStore } from "../../store/vaultStore";
import { Plus, KeyRound } from "lucide-react";

export const TopBar: React.FC = () => {
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);

  return (
    <header className="topbar">
      <input
        type="search"
        placeholder="Search vault (Cmd+F)..."
        className="topbar-search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="topbar-actions">
        <button className="topbar-btn" title="Password Generator (Cmd+G)">
          <KeyRound size={16} />
        </button>
        <button className="topbar-btn primary" title="Add New Entry (Cmd+N)">
          <Plus size={16} />
          <span>New Entry</span>
        </button>
      </div>
    </header>
  );
};
