import {
    defineConfig
} from "vite";
import react from "@vitejs/plugin-react";
import taildwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), taildwindcss()],
});