import React, { useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useVaultStore } from "./store/vaultStore";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { invoke } from "@tauri-apps/api/tauri";
import "./styles/global.css";

// Loading/Redirect component for / path
const RootRedirector: React.FC = () => {
  const navigate = useNavigate();
  const setLocked = useVaultStore((state) => state.setLocked);
  const setFirstLaunch = useVaultStore((state) => state.setFirstLaunch);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await invoke<string>("get_vault_status");
        if (status === "uninitialized") {
          setFirstLaunch(true);
          setLocked(true);
          navigate("/setup");
        } else if (status === "locked") {
          setFirstLaunch(false);
          setLocked(true);
          navigate("/login");
        } else if (status === "unlocked") {
          setFirstLaunch(false);
          setLocked(false);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check vault status:", err);
        // Default to setup if anything fails
        navigate("/setup");
      }
    };
    checkStatus();
  }, [navigate, setLocked, setFirstLaunch]);

  return (
    <div className="loading-container">
      <div className="loading-text">Loading VaultKey...</div>
    </div>
  );
};

// Route protector for Dashboard
interface ProtectedRouteProps {
  children: React.ReactElement;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isLocked = useVaultStore((state) => state.isLocked);
  return isLocked ? <Navigate to="/login" replace /> : children;
};

// Global Keyboard Shortcut Manager
const ShortcutManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLocked = useVaultStore((state) => state.isLocked);
  const setLocked = useVaultStore((state) => state.setLocked);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + L -> Lock vault
      if (isMeta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (!isLocked) {
          invoke("lock_vault").catch(() => {});
          setLocked(true);
        }
      }

      // Ctrl/Cmd + F -> Focus search
      if (isMeta && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchInput = document.querySelector(".topbar-search") as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Escape -> Clear search / close modal
      if (e.key === "Escape") {
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, setLocked, setSearchQuery]);

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <ShortcutManager>
        <Routes>
          <Route path="/" element={<RootRedirector />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShortcutManager>
    </HashRouter>
  );
};

export default App;

