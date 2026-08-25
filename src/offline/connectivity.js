"use client";
import { useEffect, useState } from "react";
import { syncOutbox } from "./sync-manager";
export function useConnectivity() {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  useEffect(() => {
    const up = () => {
      setOnline(true);
      syncOutbox();
    };
    const down = () => setOnline(false);
    addEventListener("online", up);
    addEventListener("offline", down);
    navigator.serviceWorker?.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_OUTBOX") syncOutbox();
      if (event.data?.type === "OUTBOX_CHANGED")
        window.dispatchEvent(new Event("vector:outbox-changed"));
    });
    return () => {
      removeEventListener("online", up);
      removeEventListener("offline", down);
    };
  }, []);
  return online;
}
