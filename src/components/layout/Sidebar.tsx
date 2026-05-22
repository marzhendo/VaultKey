import React from "react";
import { useVaultStore } from "../../store/vaultStore";

export const Sidebar: React.FC = () => {
  const selectedCategory = useVaultStore((state) => state.selectedCategory);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);

  const categories = [
    "All",
    "Campus",
    "Google",
    "Social Media",
    "Finance",
    "Dev Tools",
    "Favorites",
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Categories</div>
      <nav className="sidebar-nav">
        {categories.map((category) => (
          <button
            key={category}
            className={`sidebar-nav-item ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>
    </aside>
  );
};
