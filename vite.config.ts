import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `npm run dev` serves the demo app in demo/ against src/ so component changes
// hot reload. The demo is not part of the published package.
export default defineConfig({
  root: "demo",
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: { outDir: "dist", emptyOutDir: true },
});
