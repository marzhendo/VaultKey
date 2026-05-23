import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useVaultStore } from "../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";
import { ShieldAlert, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const setLocked = useVaultStore((state) => state.setLocked);
  const setFirstLaunch = useVaultStore((state) => state.setFirstLaunch);

  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", class: "" };
    if (pass.length < 12) return { score: 1, label: "Weak (Min. 12 chars)", class: "weak" };

    let score = 1; // base points for length >= 12
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);

    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;

    if (score <= 1) return { score: 1, label: "Weak", class: "weak" };
    if (score === 2) return { score: 2, label: "Fair", class: "fair" };
    if (score === 3) return { score: 3, label: "Strong", class: "strong" };
    return { score: 4, label: "Very strong", class: "very-strong" };
  };

  const strength = getPasswordStrength(password);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (password.length < 12) {
        setError("Password must be at least 12 characters long.");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setError("");
      setStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await invoke("setup_vault", { password });
      setFirstLaunch(false);
      setLocked(false);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.toString() || "Failed to setup vault.");
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="logo-container">
          <Lock size={24} />
        </div>
        <h2 className="setup-title">Setup VaultKey</h2>
        <p className="setup-description">
          Create your master password. VaultKey is 100% offline and secure.
        </p>

        {/* Step dots indicator */}
        <div className="step-indicator">
          <span className={`step-dot ${step >= 1 ? "active" : ""}`}></span>
          <span className={`step-dot ${step >= 2 ? "active" : ""}`}></span>
          <span className={`step-dot ${step >= 3 ? "active" : ""}`}></span>
        </div>

        {step === 1 && (
          <form onSubmit={handleNextStep} className="setup-form">
            <div className="password-input-wrapper">
              <Input
                label="Master Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 characters..."
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

            {password && (
              <div className="strength-container">
                <div className="strength-bar-bg">
                  <div 
                    className={`strength-bar ${strength.class}`} 
                    style={{ 
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: `var(--color-${strength.class === "very-strong" ? "success" : strength.class === "strong" ? "info" : strength.class === "fair" ? "warning" : "danger"})`
                    }}
                  ></div>
                </div>
                <span className={`strength-label ${strength.class}`}>{strength.label}</span>
              </div>
            )}

            <div className="setup-warning">
              <div className="setup-warning-text" style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span><strong>WARNING:</strong> If you forget this password, your data cannot be recovered. There is no reset option.</span>
              </div>
            </div>

            {error && <div className="setup-error">{error}</div>}
            <Button type="submit" disabled={password.length < 12}>Next Step</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNextStep} className="setup-form">
            <div className="password-input-wrapper">
              <Input
                label="Confirm Master Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password..."
                required
                autoFocus
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                style={{ top: "30px" }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {confirmPassword && (
              <div style={{ fontSize: "11px", marginBottom: "var(--space-4)", fontWeight: 500, color: password === confirmPassword ? "var(--color-success)" : "var(--color-danger)" }}>
                {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}

            <div className="setup-warning">
              <div className="setup-warning-text" style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>Confirm your master password to prevent typos. It is derived strictly offline.</span>
              </div>
            </div>

            {error && <div className="setup-error">{error}</div>}
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Button type="button" variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</Button>
              <Button type="submit" disabled={password !== confirmPassword} style={{ flex: 1 }}>Confirm</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="setup-success-screen">
            <div className="success-icon-container">
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Your vault is ready.</h3>
            <p>Your master password is secure. You can now start securing your keys.</p>
            <Button onClick={handleFinalSubmit} style={{ width: "100%" }}>Enter VaultKey</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPage;

