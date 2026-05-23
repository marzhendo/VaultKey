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
  const setEntryModalOpen = useVaultStore((state) => state.setEntryModalOpen);
  const setGeneratorOpen = useVaultStore((state) => state.setGeneratorOpen);
  const setDeleteModalOpen = useVaultStore((state) => state.setDeleteModalOpen);
  const setEntryToEdit = useVaultStore((state) => state.setEntryToEdit);
  const setEntryToDelete = useVaultStore((state) => state.setEntryToDelete);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Lock vault shortcut (Ctrl/Cmd + L)
      if (isMeta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (!isLocked) {
          invoke("lock_vault").catch(() => {});
          setLocked(true);
        }
      }

      // Add new entry shortcut (Ctrl/Cmd + N)
      if (isMeta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (!isLocked) {
          setEntryToEdit(null);
          setEntryModalOpen(true);
        }
      }

      // Open password generator shortcut (Ctrl/Cmd + G)
      if (isMeta && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (!isLocked) {
          setGeneratorOpen(true);
        }
      }

      // Focus search input (Ctrl/Cmd + F)
      if (isMeta && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (!isLocked) {
          const searchInput = document.querySelector(".topbar-search") as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
      }

      // Escape -> Clear search / close any open modal
      if (e.key === "Escape") {
        setSearchQuery("");
        setEntryModalOpen(false);
        setGeneratorOpen(false);
        setDeleteModalOpen(false);
        setEntryToEdit(null);
        setEntryToDelete(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, setLocked, setSearchQuery, setEntryModalOpen, setGeneratorOpen, setDeleteModalOpen, setEntryToEdit, setEntryToDelete]);

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

