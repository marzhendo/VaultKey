import React, { useState } from "react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface LoginPageProps {
  onUnlock: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your master password.");
      return;
    }
    setError("");
    onUnlock();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Unlock VaultKey</h2>
        <p className="login-description">
          Enter your master password to decrypt your password vault.
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Master Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error && <div className="login-error">{error}</div>}
          <Button type="submit">Unlock Vault</Button>
        </form>
      </div>
    </div>
  );
};
