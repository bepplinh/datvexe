import { useState, useRef, useEffect } from "react";
import { useUserNotifications } from "../../contexts/UserNotificationProvider";
import { Bell, CheckCheck, Bus, Clock } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { Link } from "react-router-dom";
import "./UserNotificationBell.scss";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const UserNotificationBell = () => {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useUserNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "trip.reminder":
                return <Clock className="notification-icon reminder" size={18} />;
            case "booking.success":
                return <Bus className="notification-icon booking" size={18} />;
            case "booking.cancelled":
                return <Bell className="notification-icon cancelled" size={18} />;
            case "refund.success":
                return <Bell className="notification-icon refund" size={18} />;
            case "trip.changed":
                return <Bus className="notification-icon changed" size={18} />;
            case "seat.changed":
                return <Bell className="notification-icon changed" size={18} />;
            default:
                return <Bell className="notification-icon default" size={18} />;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            return dayjs(dateString).fromNow();
        } catch {
            return "";
        }
    };

    return (
        <div className="user-notification-bell" ref={dropdownRef}>
            <button
                className={`bell-button ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={handleToggle}
                aria-label="Thông báo"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read" onClick={markAllAsRead}>
                                <CheckCheck size={14} /> Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Đang tải...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="empty-state">
                                <Bell className="empty-icon" size={40} />
                                <p>Không có thông báo nào</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? "unread" : ""}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon-wrapper">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <h4 className="notification-title">{notification.title}</h4>
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            {formatTime(notification.created_at)}
                                        </span>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="unread-dot"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="dropdown-footer">
                            <Link to="/profile/notifications" onClick={() => setIsOpen(false)}>
                                Xem tất cả thông báo
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserNotificationBell;

