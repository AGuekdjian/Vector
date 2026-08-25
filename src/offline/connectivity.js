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
    navigator.serviceWorker?.addEventListener(
      "message",
      (event) => event.data?.type === "SYNC_OUTBOX" && syncOutbox(),
    );
    return () => {
      removeEventListener("online", up);
      removeEventListener("offline", down);
    };
  }, []);
  return online;
}
