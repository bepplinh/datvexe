import {
    defineConfig
} from "vite";
import react from "@vitejs/plugin-react";
import taildwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), taildwindcss()],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    "vendor-mui": ["@mui/material", "@mui/icons-material", "@mui/x-data-grid", "@mui/x-date-pickers", "@emotion/react", "@emotion/styled"],
                    "vendor-charts": ["chart.js", "react-chartjs-2", "recharts"],
                    "vendor-utils": ["axios", "dayjs", "formik", "yup", "react-toastify", "react-hook-form"],
                },
            },
        },
    },
});