import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Emits `sw.js` with the real build output baked into it.
 *
 * A service worker written by hand cannot know the filenames it has to
 * cache, because Vite puts a content hash in every one of them. Guessing
 * with a wildcard at runtime means the first visit finds an empty cache — so
 * the list is generated from the bundle. Ported from the Fieldwork app,
 * which uses the identical plugin for the identical reason.
 */
function serviceWorker(): Plugin {
  return {
    name: "spudonomics-service-worker",
    apply: "build",
    enforce: "post",
    writeBundle(options, bundle) {
      const outDir = options.dir ?? "dist";

      // Hashed output only. Everything this static site needs to run comes
      // out of the bundle; there is no public/ directory to layer on top.
      const precache = Object.keys(bundle)
        .filter((name) => /\.(js|css|woff2|png|svg)$/.test(name) || name === "index.html")
        .sort();

      // The cache name changes only when the output does, so a rebuild that
      // produces identical files does not throw away a cached copy for no
      // reason.
      const buildId = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 12);

      const source = readFileSync(join(__dirname, "sw", "service-worker.js"), "utf8")
        .replace("__BUILD_ID__", buildId)
        .replace("__PRECACHE__", JSON.stringify(precache, null, 2));

      writeFileSync(join(outDir, "sw.js"), source, "utf8");
    },
  };
}

export default defineConfig({
  // Set VITE_BASE when hosting under a sub-path (e.g. GitHub Pages project site).
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss(), serviceWorker()],
  server: { port: 5190 },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
