import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next supplies this alias during builds. Keep its marker resolvable in
      // unit tests without adding another dependency; server I/O tests mock it.
      "server-only": "next/dist/compiled/server-only",
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
