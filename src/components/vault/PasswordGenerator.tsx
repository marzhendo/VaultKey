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
    } catch (err: any) {
      setError(err?.toString() || "Failed to generate password.");
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
    return (
      <div className="generator-container">
        {error && <div className="setup-error">{error}</div>}
        <div className="generator-result">
          <input
            type="text"
            readOnly
            value={generatedPassword}
            placeholder="Generating password..."
            className="input-field generator-result-input"
          />
          {generatedPassword && (
            <button
              type="button"
              className="copy-button"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="copied" /> : <Copy size={16} />}
            </button>
          )}
        </div>
        
        <div className="generator-options">
          <div className="generator-option">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
              <label>Length: {length}</label>
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
          
          <div className="checkbox-options">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              <span>Uppercase (A-Z)</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
              />
              <span>Lowercase (a-z)</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={numbers}
                onChange={(e) => setNumbers(e.target.checked)}
              />
              <span>Numbers (0-9)</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={symbols}
                onChange={(e) => setSymbols(e.target.checked)}
              />
              <span>Symbols (!@#$)</span>
            </label>
          </div>
        </div>
        
        {mode === "inline" && (
          <div className="inline-generator-actions">
            <Button type="button" variant="ghost" onClick={handleGenerate} style={{ gap: "4px" }}>
              <RefreshCw size={12} />
              <span>Regenerate</span>
            </Button>
            <Button type="button" variant="primary" onClick={handleSelect} disabled={!generatedPassword}>
              Use Password
            </Button>
          </div>
        )}
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
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={() => setGeneratorOpen(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleGenerate} style={{ gap: "var(--space-2)" }}>
            <RefreshCw size={14} />
            <span>Regenerate</span>
          </Button>
        </div>
      }
    >
      {renderContent()}
    </Modal>
  );
};

