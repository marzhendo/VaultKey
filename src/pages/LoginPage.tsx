import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useVaultStore } from "../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";
import { Lock, Eye, EyeOff } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setLocked = useVaultStore((state) => state.setLocked);
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your master password.");
      triggerShake();
      return;
    }

    try {
      const success = await invoke<boolean>("unlock_vault", { password });
      if (success) {
        setError("");
        setLocked(false);
        navigate("/dashboard");
      } else {
        setError("Invalid master password.");
        triggerShake();
      }
    } catch (err: any) {
      setError(err?.toString() || "Failed to unlock vault.");
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 3500); // duration of the shake animation defined in components.css
  };

  return (
    <div className="login-page">
      <div className={`login-card ${isShaking ? "shake" : ""}`}>
        <div className="logo-container">
          <Lock size={24} />
        </div>
        <h2 className="login-title">Unlock VaultKey</h2>
        <p className="login-description">Your passwords, yours alone.</p>
        
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
            />
            <button 
              type="button" 
              className="password-toggle-btn"
              style={{ top: "30px" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          {error && <div className="login-error">{error}</div>}
          <Button type="submit">Unlock Vault</Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

