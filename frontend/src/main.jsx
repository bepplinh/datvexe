import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthProvider";
import { SearchTripProvider } from "./contexts/SearchTripProvider.jsx";
import { BookingProvider } from "./contexts/BookingProvider.jsx";
import { LocationProvider } from "./contexts/LocationProvider";
import { EchoProvider } from "./contexts/EchoContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <EchoProvider>
                <LocationProvider>
                    <SearchTripProvider>
                        <BookingProvider>
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
                        </BookingProvider>
                    </SearchTripProvider>
                </LocationProvider>
            </EchoProvider>
        </AuthProvider>
    </StrictMode>
);
