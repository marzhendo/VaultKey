import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useVaultStore } from "../store/vaultStore";
import { toast } from "../store/toastStore";
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
  const [loading, setLoading] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", class: "" };
    if (pass.length < 12) return { score: 1, label: "Weak (Min. 12 chars)", class: "weak" };

    let criteriaMet = 0;
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);

    if (hasLower && hasUpper) criteriaMet++;
    if (hasNumber) criteriaMet++;
    if (hasSymbol) criteriaMet++;
    if (pass.length >= 16) criteriaMet++;

    // Total score: base of 1 (for length >= 12) + criteriaMet (max 4)
    const score = Math.min(4, 1 + criteriaMet);

    if (score === 1) return { score: 1, label: "Weak (Use casing mix & numbers)", class: "weak" };
    if (score === 2) return { score: 2, label: "Fair (Add numbers or symbols)", class: "fair" };
    if (score === 3) return { score: 3, label: "Strong", class: "strong" };
    return { score: 4, label: "Very strong", class: "very-strong" };
  };

  const strength = getPasswordStrength(password);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (password.length < 12) {
        toast.error("Password must be at least 12 characters long.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      setStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      await invoke("setup_vault", { password });
      setFirstLaunch(false);
      setLocked(false);
      toast.success("Vault successfully set up!");
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to setup vault.");
    } finally {
      setLoading(false);
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
                className="password-toggle-btn login-toggle-btn"
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
                      width: `${(strength.score / 4) * 100}%`
                    }}
                  ></div>
                </div>
                <span className={`strength-label ${strength.class}`}>{strength.label}</span>
              </div>
            )}

            <div className="setup-warning">
              <div className="setup-warning-text setup-warning-layout">
                <ShieldAlert size={14} className="setup-warning-icon" />
                <span>
                  <strong>Important:</strong> VaultKey is a zero-knowledge local vault. We cannot reset your password, send a recovery link, or recover your data if you forget it. Please write it down and store it in a safe place.
                </span>
              </div>
            </div>

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
                className="password-toggle-btn login-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {confirmPassword && (
              <div className={password === confirmPassword ? "confirm-match-message" : "confirm-mismatch-message"}>
                {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}

            <div className="setup-warning">
              <div className="setup-warning-text setup-warning-layout">
                <ShieldAlert size={14} className="setup-warning-icon" />
                <span>
                  <strong>Typos happen:</strong> Confirming your master password ensures you didn't make a typo. Everything is calculated completely offline on your device, ensuring maximum security.
                </span>
              </div>
            </div>

            <div className="setup-buttons-row">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" disabled={password !== confirmPassword}>Confirm</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="setup-success-screen">
            <div className="success-icon-container">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="setup-success-title">Your vault is ready.</h3>
            <p>Your master password is secure. You can now start securing your keys.</p>
            <Button onClick={handleFinalSubmit} isLoading={loading} style={{ width: "100%" }}>Enter VaultKey</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPage;

