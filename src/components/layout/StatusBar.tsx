import React from "react";
import { useAutoLock } from "../../hooks/useAutoLock";
import { useVaultStore } from "../../store/vaultStore";
import { Shield, ShieldAlert } from "lucide-react";

export const StatusBar: React.FC = () => {
  const { timeRemaining } = useAutoLock();
  const isLocked = useVaultStore((state) => state.isLocked);
  const lockWarning = useVaultStore((state) => state.lockWarning);
  const statusMessage = useVaultStore((state) => state.statusMessage);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <footer className="status-bar">
      <div className="status-bar-info">
        <span className={`status-bar-dot ${isLocked ? "locked" : "unlocked"}`}></span>
        <span>{statusMessage || (isLocked ? "Vault locked" : "Vault unlocked")}</span>
      </div>
      
      {!isLocked && (
        <div className={`status-bar-timer ${lockWarning ? "warning" : ""}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {lockWarning ? <ShieldAlert size={12} /> : <Shield size={12} />}
          <span>Auto-lock in: {timeFormatted}</span>
        </div>
      )}
    </footer>
  );
};

