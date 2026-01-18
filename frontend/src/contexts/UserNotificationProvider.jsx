import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useEcho } from "./EchoContext";
import { userNotificationService } from "../services/userNotificationService";

const UserNotificationContext = createContext(null);

export const useUserNotifications = () => useContext(UserNotificationContext);

export const UserNotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const echo = useEcho();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch notifications on mount
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        let ignore = false;

        const fetchNotifications = async () => {
            try {
                const { data, unread_count } = await userNotificationService.list(20);
                if (!ignore) {
                    setNotifications(data);
                    setUnreadCount(unread_count);
                }
            } catch (error) {
                console.error("Failed to fetch user notifications:", error);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchNotifications();

        return () => {
            ignore = true;
        };
    }, [user]);

    // Subscribe to realtime notifications
    useEffect(() => {
        if (!user || !echo) return;

        const channel = echo.private(`user.notifications.${user.id}`);

        channel.listen(".UserNotificationCreated", ({ notification }) => {
            // Add new notification to the top
            setNotifications((prev) => [notification, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);

            // Optional: Show browser notification if permission granted
            if (Notification.permission === "granted") {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: "/favicon.ico",
                });
            }
        });

        return () => {
            channel.stopListening(".UserNotificationCreated");
            channel.unsubscribe?.();
        };
    }, [user, echo]);

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((item) =>
                item.id === notificationId
                    ? { ...item, is_read: true, read_at: new Date().toISOString() }
                    : item
            )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));

        try {
            await userNotificationService.markAsRead(notificationId);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // Could revert optimistic update here if needed
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((item) => ({
                ...item,
                is_read: true,
                read_at: item.read_at ?? new Date().toISOString(),
            }))
        );
        setUnreadCount(0);

        try {
            await userNotificationService.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    }, []);

    // Refresh notifications
    const refresh = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, unread_count } = await userNotificationService.list(20);
            setNotifications(data);
            setUnreadCount(unread_count);
        } catch (error) {
            console.error("Failed to refresh notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const value = useMemo(
        () => ({
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refresh,
        }),
        [notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh]
    );

    return (
        <UserNotificationContext.Provider value={value}>
            {children}
        </UserNotificationContext.Provider>
    );
};

export default UserNotificationProvider;
