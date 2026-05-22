import React, { useState } from "react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface SetupPageProps {
  onSetupComplete: () => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onSetupComplete }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    onSetupComplete();
  };

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h2 className="setup-title">Setup VaultKey</h2>
        <p className="setup-description">
          Set up a strong master password to secure your passwords. VaultKey is entirely local.
        </p>
        <form onSubmit={handleSubmit} className="setup-form">
          <Input
            label="Master Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <div className="setup-error">{error}</div>}
          <Button type="submit">Create Vault</Button>
        </form>
      </div>
    </div>
  );
};
