import React from "react";
import { useAutoLock } from "../../hooks/useAutoLock";
import { Shield } from "lucide-react";

export const StatusBar: React.FC = () => {
  const { secondsRemaining } = useAutoLock();

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isWarning = secondsRemaining <= 60;

  return (
    <footer className="status-bar">
      <div className="status-bar-info">
        <Shield size={12} className="status-bar-icon" />
        <span>Secure Local Connection</span>
      </div>
      <div className={`status-bar-timer ${isWarning ? "warning" : ""}`}>
        Auto-locking in: {timeFormatted}
      </div>
    </footer>
  );
};
