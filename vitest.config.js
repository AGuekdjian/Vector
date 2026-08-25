import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/server-only.js"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
