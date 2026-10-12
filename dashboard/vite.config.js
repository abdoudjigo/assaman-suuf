import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Active la transformation JSX pour les composants React.
export default defineConfig({
  plugins: [react()],
});
