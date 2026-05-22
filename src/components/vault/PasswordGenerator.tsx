import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useClipboard } from "../../hooks/useClipboard";
import { Copy } from "lucide-react";

interface PasswordGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  isOpen,
  onClose,
}) => {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const { copy } = useClipboard();

  const handleGenerate = () => {
    const chars = {
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lower: "abcdefghijklmnopqrstuvwxyz",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    };

    let allowed = "";
    if (uppercase) allowed += chars.upper;
    if (lowercase) allowed += chars.lower;
    if (numbers) allowed += chars.numbers;
    if (symbols) allowed += chars.symbols;

    if (!allowed) {
      setGeneratedPassword("");
      return;
    }

    let password = "";
    for (let i = 0; i < length; i++) {
      password += allowed.charAt(Math.floor(Math.random() * allowed.length));
    }
    setGeneratedPassword(password);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Password"
      footer={
        <div className="entry-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleGenerate}>
            Generate
          </Button>
        </div>
      }
    >
      <div className="generator-container">
        <div className="generator-result">
          <input
            type="text"
            readOnly
            value={generatedPassword}
            placeholder="Click Generate to start"
            className="input-field generator-result-input"
          />
          {generatedPassword && (
            <button
              className="copy-button"
              onClick={() => copy(generatedPassword)}
              title="Copy"
            >
              <Copy size={16} />
            </button>
          )}
        </div>
        <div className="generator-options">
          <div className="generator-option">
            <label>Length: {length}</label>
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
              <span>Special Symbols (!@#$)</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};
