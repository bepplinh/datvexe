import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useEcho } from "./EchoContext";
import { adminNotificationService } from "../services/adminNotificationService";

const AdminNotificationContext = createContext(null);
export const useAdminNotifications = () => useContext(AdminNotificationContext);

export const AdminNotificationProvider = ({ children }) => {
    const { admin } = useAdminAuth();
    const echo = useEcho();
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!admin) return;
        let ignore = false;

        const fetchData = async () => {
            try {
                const { data, unread_count } = await adminNotificationService.list(20);
                if (!ignore) {
                    setItems(data);
                    setUnreadCount(unread_count);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchData();
        return () => {
            ignore = true;
        };
    }, [admin]);

    useEffect(() => {
        if (!admin || !echo) return;

        const channel = echo.private("admin.notifications");

        channel.listen(".AdminNotificationCreated", ({ notification }) => {
            setItems((prev) => [notification, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            channel.stopListening(".AdminNotificationCreated");
            channel.unsubscribe?.();
        };
    }, [admin, echo]);

    const markOneAsRead = async (id) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, is_read: true, read_at: new Date().toISOString() }
                    : item
            )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
        await adminNotificationService.markAsRead(id);
    };

    const markAllAsRead = async () => {
        setItems((prev) =>
            prev.map((item) => ({
                ...item,
                is_read: true,
                read_at: item.read_at ?? new Date().toISOString(),
            }))
        );
        setUnreadCount(0);
        await adminNotificationService.markAllAsRead();
    };

    const value = useMemo(
        () => ({
            notifications: items,
            unreadCount,
            loading,
            markOneAsRead,
            markAllAsRead,
        }),
        [items, unreadCount, loading]
    );

    return (
        <AdminNotificationContext.Provider value={value}>
            {children}
        </AdminNotificationContext.Provider>
    );
};