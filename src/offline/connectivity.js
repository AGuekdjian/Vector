"use client";
import { useEffect, useState } from "react";
import { syncOutbox } from "./sync-manager";
export function useConnectivity() {
  // Keep the server and first browser render identical, then read the real
  // browser state after hydration.
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      syncOutbox();
    };
    const down = () => setOnline(false);
    const onServiceWorkerMessage = (event) => {
      if (event.data?.type === "SYNC_OUTBOX") syncOutbox();
      if (event.data?.type === "OUTBOX_CHANGED")
        window.dispatchEvent(new Event("vector:outbox-changed"));
    };
    queueMicrotask(() => setOnline(navigator.onLine));
    addEventListener("online", up);
    addEventListener("offline", down);
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);
    return () => {
      removeEventListener("online", up);
      removeEventListener("offline", down);
      navigator.serviceWorker?.removeEventListener(
        "message",
        onServiceWorkerMessage,
      );
    };
  }, []);
  return online;
}
