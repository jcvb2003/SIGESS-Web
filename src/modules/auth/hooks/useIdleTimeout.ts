import { useState, useEffect, useCallback, useRef } from "react";
interface UseIdleTimeoutOptions {
  timeout?: number;
  onTimeout?: () => void;
}
const DEFAULT_TIMEOUT = 30 * 60 * 1000;
const STORAGE_KEY = "last_activity_timestamp";
export function useIdleTimeout({
  timeout = DEFAULT_TIMEOUT,
  onTimeout,
}: UseIdleTimeoutOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hasTimedOutRef = useRef(false);
  const getLastActivity = (): number => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  };
  const setLastActivity = (time: number) => {
    localStorage.setItem(STORAGE_KEY, time.toString());
  };
  const handleTimeout = useCallback(() => {
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    setIsIdle(true);
    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);
  const resetTimer = useCallback(
    (broadcast = true) => {
      const now = Date.now();
      setLastActivity(now);
      hasTimedOutRef.current = false;
      setIsIdle(false);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(() => {
        handleTimeout();
      }, timeout);
      if (broadcast && channelRef.current) {
        channelRef.current.postMessage({ type: "ACTIVITY", timestamp: now });
      }
    },
    [handleTimeout, timeout],
  );
  useEffect(() => {
    channelRef.current = new BroadcastChannel("idle_timeout_channel");
    channelRef.current.onmessage = (event) => {
      if (event.data && event.data.type === "ACTIVITY") {
        resetTimer(false);
      }
    };
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [resetTimer]);
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    let lastActivityTime = 0;
    const THROTTLE_DELAY = 1000;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime >= THROTTLE_DELAY) {
        resetTimer(true);
        lastActivityTime = now;
      }
    };
    const lastActivity = getLastActivity();
    const timeSinceLastActivity = Date.now() - lastActivity;
    const initialCheckTimeoutId = setTimeout(() => {
      if (timeSinceLastActivity >= timeout) {
        handleTimeout();
      } else {
        resetTimer(true);
      }
    }, 0);
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const lastActivity = getLastActivity();
        const timeSinceLastActivity = Date.now() - lastActivity;
        if (timeSinceLastActivity >= timeout) {
          handleTimeout();
        } else {
          resetTimer(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearTimeout(initialCheckTimeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [resetTimer, handleTimeout, timeout]);
  return { isIdle };
}
