import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: "src/public",
  base: "/app/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth"],
          react: ["react", "react-dom"],
          markdown: ["react-markdown", "remark-gfm"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(new URL(".", import.meta.url).pathname, "./src"),
    },
  },
  server: {
    // Makes the server accessible on the local network (e.g., for mobile testing)
    host: true,
    proxy: {
      // Proxy API requests to the backend server
      "/api": {
        target: "http://127.0.0.1:8000", // Default backend address
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
