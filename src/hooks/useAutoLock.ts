import { useEffect, useRef, useState } from "react";
import { useVaultStore } from "../store/vaultStore";
import { invoke } from "@tauri-apps/api/tauri";

export function useAutoLock() {
  const isLocked = useVaultStore((state) => state.isLocked);
  const setLocked = useVaultStore((state) => state.setLocked);
  const setLockWarning = useVaultStore((state) => state.setLockWarning);
  
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes (300 seconds)
  const timerRef = useRef<number | null>(null);
  const latestSecondsRemaining = useRef(300);

  const resetTimer = () => {
    setSecondsRemaining(300);
    latestSecondsRemaining.current = 300;
    setLockWarning(false);
  };

  useEffect(() => {
    if (isLocked) {
      setSecondsRemaining(300);
      latestSecondsRemaining.current = 300;
      setLockWarning(false);
      return;
    }

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    timerRef.current = window.setInterval(async () => {
      const nextSeconds = latestSecondsRemaining.current - 1;
      latestSecondsRemaining.current = nextSeconds;
      setSecondsRemaining(nextSeconds);

      if (nextSeconds <= 60 && nextSeconds > 0) {
        setLockWarning(true);
      }

      if (nextSeconds <= 0) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        try {
          await invoke("lock_vault");
        } catch (e) {
          // ignore or log
        }
        setLocked(true);
        setLockWarning(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLocked, setLocked, setLockWarning]);

  return { timeRemaining: secondsRemaining };
}

