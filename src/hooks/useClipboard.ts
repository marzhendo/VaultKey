import { useState, useRef, useEffect } from "react";
import { useVaultStore } from "../store/vaultStore";

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const setStatusMessage = useVaultStore((state) => state.setStatusMessage);

  const copy = async (text: string) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setStatusMessage("Copied to clipboard");

      // Swap icon back after 1500ms
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);

      // Clear the "Copied to clipboard" status message after 3000ms
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = window.setTimeout(() => {
        setStatusMessage(null);
      }, 3000);

      // Auto-clear clipboard after 30 seconds without exception
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
          setStatusMessage("Clipboard cleared");
          if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
          statusTimerRef.current = window.setTimeout(() => {
            setStatusMessage(null);
          }, 3000);
        } catch {
          // Fallback or ignore if background is locked/blocked
        }
      }, 30000);

      return true;
    } catch {
      return false;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    };
  }, []);

  return { copied, copy };
}
