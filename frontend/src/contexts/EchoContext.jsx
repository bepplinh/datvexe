import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { createEchoInstance } from "../lib/echo";

const EchoContext = createContext(null);

export const EchoProvider = ({ children }) => {
    const echoInstanceRef = useRef(null);
    const [echoInstance, setEchoInstance] = useState(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 1000; // 1 second

    // Create or recreate Echo instance
    const createInstance = useCallback(() => {
        try {
            // Disconnect existing instance if any
            if (echoInstanceRef.current) {
                try {
                    echoInstanceRef.current.disconnect();
                } catch (e) {
                    console.warn("[Echo] Error disconnecting old instance:", e);
                }
            }

            const newInstance = createEchoInstance();
            echoInstanceRef.current = newInstance;
            setEchoInstance(newInstance);

            // Setup connection state listeners
            if (newInstance.connector?.pusher) {
                const pusher = newInstance.connector.pusher;

                pusher.connection.bind("connected", () => {
                    console.log("[Echo] ✅ Connected to WebSocket");
                    reconnectAttemptsRef.current = 0; // Reset reconnect attempts
                });

                pusher.connection.bind("disconnected", () => {
                    console.warn("[Echo] ⚠️ Disconnected from WebSocket");
                    scheduleReconnect();
                });

                pusher.connection.bind("error", (error) => {
                    console.error("[Echo] ❌ Connection error:", error);
                    scheduleReconnect();
                });

                pusher.connection.bind("unavailable", () => {
                    console.warn("[Echo] ⚠️ Connection unavailable");
                    scheduleReconnect();
                });
            }

            return newInstance;
        } catch (error) {
            console.error("[Echo] Failed to create instance:", error);
            scheduleReconnect();
            return null;
        }
    }, []);

    // Schedule reconnection with exponential backoff
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error("[Echo] Max reconnect attempts reached. Please reload the page.");
            return;
        }

        const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 seconds
        );

        console.log(`[Echo] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log("[Echo] Attempting to reconnect...");
            createInstance();
        }, delay);
    }, [createInstance]);

    // Check connection health
    const checkConnectionHealth = useCallback(() => {
        const pusher = echoInstanceRef.current?.connector?.pusher;
        if (!pusher) {
            console.log("[Echo] No pusher instance, creating new one...");
            createInstance();
            return;
        }

        const state = pusher.connection.state;
        console.log("[Echo] Connection state:", state);

        if (state === "disconnected" || state === "unavailable" || state === "failed") {
            console.log("[Echo] Connection not healthy, reconnecting...");
            createInstance();
        }
    }, [createInstance]);

    // Initialize on mount
    useEffect(() => {
        if (!echoInstanceRef.current) {
            createInstance();
        }

        // Handle visibility change (user returns to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                console.log("[Echo] Tab became visible, checking connection...");
                // Small delay to let browser restore connections
                setTimeout(checkConnectionHealth, 500);
            }
        };

        // Handle online/offline events
        const handleOnline = () => {
            console.log("[Echo] Network online, checking connection...");
            setTimeout(checkConnectionHealth, 1000);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("online", handleOnline);

        // Periodic health check every 30 seconds
        const healthCheckInterval = setInterval(() => {
            if (document.visibilityState === "visible") {
                const pusher = echoInstanceRef.current?.connector?.pusher;
                const state = pusher?.connection?.state;
                if (state && state !== "connected" && state !== "connecting") {
                    console.log("[Echo] Health check: connection unhealthy, reconnecting...");
                    createInstance();
                }
            }
        }, 30000);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("online", handleOnline);
            clearInterval(healthCheckInterval);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (echoInstanceRef.current) {
                try {
                    echoInstanceRef.current.disconnect();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [createInstance, checkConnectionHealth]);

    return (
        <EchoContext.Provider value={echoInstance}>
            {children}
        </EchoContext.Provider>
    );
};

export const useEcho = () => {
    return useContext(EchoContext);
};