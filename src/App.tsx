import React, { useEffect, useState } from "react";
import { useVaultStore } from "./store/vaultStore";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { DashboardPage } from "./pages/DashboardPage";
import "./styles/global.css";

export const App: React.FC = () => {
  const isLocked = useVaultStore((state) => state.isLocked);
  const setLocked = useVaultStore((state) => state.setLocked);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setLocked(true);
      }

      if (isMeta && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchInput = document.querySelector(
          ".topbar-search"
        ) as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocked, setSearchQuery]);

  if (!isInitialized) {
    return <SetupPage onSetupComplete={() => setIsInitialized(true)} />;
  }

  if (isLocked) {
    return <LoginPage onUnlock={() => setLocked(false)} />;
  }

  return <DashboardPage />;
};

export default App;
//
