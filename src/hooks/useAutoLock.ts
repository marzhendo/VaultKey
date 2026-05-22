import { useEffect, useRef, useState } from "react";
import { useVaultStore } from "../store/vaultStore";

export function useAutoLock() {
  const isLocked = useVaultStore((state) => state.isLocked);
  const setLocked = useVaultStore((state) => state.setLocked);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes
  const timerRef = useRef<number | null>(null);

  const resetTimer = () => {
    setSecondsRemaining(300);
  };

  useEffect(() => {
    if (isLocked) return;

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLocked, setLocked]);

  return { secondsRemaining };
}
