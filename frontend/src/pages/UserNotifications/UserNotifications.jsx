import { useState, useEffect } from "react";
import { useUserNotifications } from "../../contexts/UserNotificationProvider";
import { Bell, CheckCheck, Bus, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { Link, useNavigate } from "react-router-dom";
import "./UserNotifications.scss";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const UserNotifications = () => {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh } = useUserNotifications();
    const navigate = useNavigate();
    const [filter, setFilter] = useState("all"); // all, unread, read

    const filteredNotifications = notifications.filter((notification) => {
        if (filter === "unread") return !notification.is_read;
        if (filter === "read") return notification.is_read;
        return true;
    });

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "trip.reminder":
                return <Clock className="notification-icon reminder" size={24} />;
            case "booking.success":
                return <Bus className="notification-icon booking" size={24} />;
            case "booking.cancelled":
                return <Bell className="notification-icon cancelled" size={24} />;
            case "refund.success":
                return <Bell className="notification-icon refund" size={24} />;
            case "trip.changed":
                return <Bus className="notification-icon changed" size={24} />;
            case "seat.changed":
                return <Bell className="notification-icon changed" size={24} />;
            default:
                return <Bell className="notification-icon default" size={24} />;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        const date = dayjs(dateString);
        const now = dayjs();

        if (now.diff(date, "day") < 1) {
            return date.fromNow();
        } else if (now.diff(date, "day") < 7) {
            return date.format("dddd, HH:mm");
        } else {
            return date.format("DD/MM/YYYY HH:mm");
        }
    };

    return (
        <div className="user-notifications-page">
            <div className="notifications-container">
                {/* Header */}
                <div className="notifications-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1>Thông báo</h1>
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount} chưa đọc</span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="refresh-btn" onClick={refresh} disabled={loading}>
                            <RefreshCw size={18} className={loading ? "spinning" : ""} />
                        </button>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllAsRead}>
                                <CheckCheck size={18} />
                                Đọc tất cả
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        Tất cả ({notifications.length})
                    </button>
                    <button
                        className={`filter-tab ${filter === "unread" ? "active" : ""}`}
                        onClick={() => setFilter("unread")}
                    >
                        Chưa đọc ({unreadCount})
                    </button>
                    <button
                        className={`filter-tab ${filter === "read" ? "active" : ""}`}
                        onClick={() => setFilter("read")}
                    >
                        Đã đọc ({notifications.length - unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                <div className="notifications-list">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải thông báo...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <Bell size={60} />
                            <h3>Không có thông báo</h3>
                            <p>
                                {filter === "unread"
                                    ? "Bạn đã đọc tất cả thông báo!"
                                    : "Chưa có thông báo nào."}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
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
                                    <div className="notification-meta">
                                        <span className="notification-time">
                                            {formatTime(notification.created_at)}
                                        </span>
                                        {notification.data?.booking_code && (
                                            <span className="notification-booking">
                                                Mã vé: {notification.data.booking_code}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!notification.is_read && <div className="unread-dot"></div>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserNotifications;
