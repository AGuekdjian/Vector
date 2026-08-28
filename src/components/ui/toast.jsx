"use client";

import { useEffect } from "react";

export function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = setTimeout(onClose, 4500);
    return () => clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div
      className={`app-toast toast-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="toast-symbol" aria-hidden="true">
        {tone === "error" ? "!" : "✓"}
      </span>
      <p>{message}</p>
      <button type="button" onClick={onClose} aria-label="Cerrar mensaje">
        ×
      </button>
    </div>
  );
}
