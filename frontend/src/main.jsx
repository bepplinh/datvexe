import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthProvider";
import { SearchTripProvider } from "./contexts/SearchTripProvider.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <SearchTripProvider>
                <App />
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    draggable
                    theme="light"
                />
            </SearchTripProvider>
        </AuthProvider>
    </StrictMode>
);
