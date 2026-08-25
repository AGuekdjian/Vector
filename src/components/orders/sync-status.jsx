"use client";
import { useEffect, useState } from "react";
import {
  discardOperation,
  listOutboxOperations,
  retryOperation,
} from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
export function SyncStatus() {
  const [items, setItems] = useState([]);
  const refresh = () => listOutboxOperations().then(setItems);
  useEffect(() => {
    refresh();
    addEventListener("vector:outbox-changed", refresh);
    return () => removeEventListener("vector:outbox-changed", refresh);
  }, []);
  return (
    <ul className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <li key={item.operationId} className="rounded-xl border bg-white p-4">
            <div className="flex justify-between">
              <strong>{item.kind}</strong>
              <span>{item.status}</span>
            </div>
            <p className="mt-1 break-all text-xs text-zinc-500">
              {item.operationId}
            </p>
            {["FAILED", "CONFLICT"].includes(item.status) && (
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
                  onClick={async () => {
                    await retryOperation(item.operationId);
                    syncOutbox();
                  }}
                >
                  Reintentar
                </button>
                <button
                  className="rounded border px-3 py-2 text-sm"
                  onClick={() =>
                    confirm("¿Descartar esta operación local?") &&
                    discardOperation(item.operationId)
                  }
                >
                  Descartar
                </button>
              </div>
            )}
          </li>
        ))
      ) : (
        <li className="rounded-xl border border-dashed p-6 text-center text-zinc-600">
          No hay operaciones offline.
        </li>
      )}
    </ul>
  );
}
