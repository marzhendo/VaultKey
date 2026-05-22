import { useState } from "react";

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Swap icon back after 1.5 seconds
      setTimeout(() => {
        setCopied(false);
      }, 1500);

      // Auto-clear clipboard after 30 seconds without exception
      setTimeout(async () => {
        const currentText = await navigator.clipboard.readText().catch(() => "");
        if (currentText === text) {
          await navigator.clipboard.writeText("");
        }
      }, 30000);

      return true;
    } catch {
      return false;
    }
  };

  return { copied, copy };
}
