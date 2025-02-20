import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import commonjs from "vite-plugin-commonjs";

// https://vitejs.dev/config/
export default defineConfig({
  // base dir for gh-pages
  base: "typescript-runtime-time-benchmarks/",
  plugins: [
    react(),
    // to enable loading sql.js which is only available as a commonjs module
    commonjs(),
  ],
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm", "sql.js"],
  },
  // for sql.js, enables `import urlForSomethingWasm from 'something.wasm'`
  assetsInclude: ["**/*.wasm"],
});
