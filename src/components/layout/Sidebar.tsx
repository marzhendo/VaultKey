import React, { useEffect, useState } from "react";
import { useVaultStore } from "../../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";
import { 
  Key, Star, School, Globe, Users, 
  CreditCard, Terminal, Settings, KeyRound, Lock 
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const activeCategory = useVaultStore((state) => state.activeCategory);
  const setActiveCategory = useVaultStore((state) => state.setActiveCategory);
  const entries = useVaultStore((state) => state.entries);
  const setGeneratorOpen = useVaultStore((state) => state.setGeneratorOpen);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await invoke<string[]>("get_categories");
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, [entries]);

  // Load theme on mount
  useEffect(() => {
    const activeTheme = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const getCategoryIcon = (catName: string) => {
    switch (catName) {
      case "Campus": return <School size={16} />;
      case "Google": return <Globe size={16} />;
      case "Social Media": return <Users size={16} />;
      case "Finance": return <CreditCard size={16} />;
      case "Dev Tools": return <Terminal size={16} />;
      default: return <Key size={16} />;
    }
  };

  const allItemsCount = entries.length;
  const favoritesCount = entries.filter((e) => e.is_favorite).length;

  const getCategoryCount = (catName: string) => {
    return entries.filter((e) => e.category === catName).length;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top-section">
        <div className="sidebar-header-section">
          <div className="sidebar-logo-container">
            <Lock size={14} />
          </div>
          <div className="sidebar-header-titles">
            <span className="sidebar-title">VaultKey</span>
            <span className="sidebar-meta">{allItemsCount} items</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Vault</span>
          
          <button
            className={`sidebar-nav-item ${activeCategory === null ? "active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            <div className="sidebar-nav-label-group">
              <Key size={16} />
              <span>All Items</span>
            </div>
            {allItemsCount > 0 && <span className="sidebar-nav-badge">{allItemsCount}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeCategory === "Favorites" ? "active" : ""}`}
            onClick={() => setActiveCategory("Favorites")}
          >
            <div className="sidebar-nav-label-group">
              <Star size={16} />
              <span>Favorites</span>
            </div>
            {favoritesCount > 0 && <span className="sidebar-nav-badge">{favoritesCount}</span>}
          </button>

          <span className="sidebar-section-label">Categories</span>
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                className={`sidebar-nav-item ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <div className="sidebar-nav-label-group">
                  {getCategoryIcon(cat)}
                  <span>{cat}</span>
                </div>
                {count > 0 && <span className="sidebar-nav-badge">{count}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-bottom-actions">
          <button 
            className="btn btn-ghost" 
            style={{ width: "100%", justifyContent: "flex-start", gap: "var(--space-2)" }}
            onClick={() => setGeneratorOpen(true)}
          >
            <KeyRound size={16} />
            <span>Generator</span>
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase" }}>Theme</span>
          <button 
            className="icon-btn" 
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

