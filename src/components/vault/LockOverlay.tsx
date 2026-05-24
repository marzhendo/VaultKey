import React, { useState } from "react";
import { useVaultStore } from "../../store/vaultStore";
import { toast } from "../../store/toastStore";
import { invoke } from "@tauri-apps/api/tauri";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export const LockOverlay: React.FC = () => {
  const setLocked = useVaultStore((state) => state.setLocked);
  const refreshEntries = useVaultStore((state) => state.refreshEntries);
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your master password.");
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const success = await invoke<boolean>("unlock_vault", { password });
      if (success) {
        setLocked(false);
        setPassword("");
        toast.success("Vault unlocked");
        await refreshEntries();
      } else {
        toast.error("Incorrect master password.");
        triggerShake();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to unlock vault.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 350);
  };

  return (
    <div className="lock-overlay-screen">
      <div className={`lock-overlay-card ${isShaking ? "shake" : ""}`}>
        <div className="logo-container">
          <Lock size={24} />
        </div>
        <h2 className="login-title">VaultKey Locked</h2>
        <p className="login-description">Enter master password to return to session.</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="password-input-wrapper">
            <Input
              label="Master Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password..."
              required
              autoFocus
              disabled={loading}
            />
            <button 
              type="button" 
              className="password-toggle-btn login-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <Button type="submit" isLoading={loading}>Unlock Vault</Button>
        </form>
      </div>
    </div>
  );
};

export default LockOverlay;
