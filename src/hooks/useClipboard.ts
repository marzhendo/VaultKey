import { useState, useRef, useEffect } from "react";

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  const copy = async (text: string) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Swap icon back after 1500ms
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);

      // Auto-clear clipboard after 30 seconds without exception
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
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
    };
  }, []);

  return { copied, copy };
}

