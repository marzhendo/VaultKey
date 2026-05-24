import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useClipboard } from "../../hooks/useClipboard";
import { useVaultStore } from "../../store/vaultStore";
import { Copy, RefreshCw, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

interface PasswordGeneratorProps {
  mode?: "standalone" | "inline";
  onSelect?: (password: string) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  mode = "standalone",
  onSelect,
}) => {
  const isGeneratorOpen = useVaultStore((state) => state.isGeneratorOpen);
  const setGeneratorOpen = useVaultStore((state) => state.setGeneratorOpen);

  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [error, setError] = useState("");
  
  const { copy, copied } = useClipboard();

  const handleGenerate = useCallback(async () => {
    if (!uppercase && !lowercase && !numbers && !symbols) {
      setGeneratedPassword("");
      setError("Please select at least one character set.");
      return;
    }
    setError("");
    try {
      const pass = await invoke<string>("generate_password", {
        length,
        uppercase,
        lowercase,
        numbers,
        symbols,
      });
      setGeneratedPassword(pass);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Failed to generate password.");
    }
  }, [length, uppercase, lowercase, numbers, symbols]);

  // Generate on mount and on any control change
  useEffect(() => {
    if (mode === "inline" || isGeneratorOpen) {
      handleGenerate();
    }
  }, [handleGenerate, mode, isGeneratorOpen]);

  const handleCopy = async () => {
    if (generatedPassword) {
      await copy(generatedPassword);
    }
  };

  const handleSelect = () => {
    if (generatedPassword && onSelect) {
      onSelect(generatedPassword);
    }
  };

  const renderContent = () => {
    const allUnchecked = !uppercase && !lowercase && !numbers && !symbols;

    return (
      <div className="generator-container">
        {error && <div className="setup-error" style={{ marginBottom: "var(--space-2)" }}>{error}</div>}
        
        <div className="generator-option" style={{ marginBottom: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>
              Length: {length}
            </label>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="range-input"
          />
        </div>
        
        <div className="checkbox-options" style={{ marginBottom: "var(--space-4)" }}>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <span>Uppercase (A–Z)</span>
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <span>Lowercase (a–z)</span>
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />
            <span>Numbers (0–9)</span>
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <span>Symbols (!@#$...)</span>
          </label>
        </div>

        <div className="generator-result" style={{ marginBottom: "var(--space-4)" }}>
          <input
            type="text"
            readOnly
            value={generatedPassword}
            placeholder="Generating password..."
            className="input-field generator-result-input"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: "13px",
              backgroundColor: "var(--color-bg-secondary)",
              width: "100%"
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
          <button 
            type="button" 
            className="icon-btn" 
            onClick={handleGenerate} 
            disabled={allUnchecked}
            title="Regenerate"
            style={{ 
              width: "36px", 
              height: "36px", 
              backgroundColor: "var(--color-bg-secondary)", 
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <RefreshCw size={16} />
          </button>
          
          {mode === "inline" ? (
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleSelect} 
              disabled={allUnchecked || !generatedPassword}
            >
              Use Password
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleCopy} 
              disabled={allUnchecked || !generatedPassword}
              style={{ gap: "var(--space-2)" }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Password"}</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (mode === "inline") {
    return renderContent();
  }

  return (
    <Modal
      isOpen={isGeneratorOpen}
      onClose={() => setGeneratorOpen(false)}
      title="Generate Password"
    >
      {renderContent()}
    </Modal>
  );
};
