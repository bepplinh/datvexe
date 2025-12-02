import { useState, useEffect, useCallback } from "react";
import { useAdminNotifications } from "../../../contexts/AdminNotificationProvider";
import { adminNotificationService } from "../../../services/adminNotificationService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import {
    Bell,
    CheckCircle2,
    Circle,
    Search,
    Filter,
    CheckCheck,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import "./Notifications.scss";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const Notifications = () => {
    const { unreadCount, markOneAsRead, markAllAsRead } = useAdminNotifications();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });
    const [filters, setFilters] = useState({
        is_read: null, // null = all, true = read, false = unread
        search: "",
    });
    const [activeFilter, setActiveFilter] = useState("all"); // all, unread, read

    const fetchNotifications = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 20,
            };

            if (filters.is_read !== null) {
                params.is_read = filters.is_read;
            }

            if (filters.search) {
                params.search = filters.search;
            }

            const response = await adminNotificationService.list(20, page, params);
            setNotifications(response.data || []);
            setPagination(response.pagination || pagination);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Không thể tải thông báo");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchNotifications(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleFilterChange = (filterType) => {
        setActiveFilter(filterType);
        if (filterType === "all") {
            setFilters((prev) => ({ ...prev, is_read: null }));
        } else if (filterType === "unread") {
            setFilters((prev) => ({ ...prev, is_read: false }));
        } else if (filterType === "read") {
            setFilters((prev) => ({ ...prev, is_read: true }));
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setFilters((prev) => ({ ...prev, search: value }));
    };

    const handleMarkAsRead = async (notification) => {
        try {
            await adminNotificationService.markAsRead(notification.id);
            markOneAsRead(notification.id);
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? { ...item, is_read: true, read_at: new Date().toISOString() }
                        : item
                )
            );
            toast.success("Đã đánh dấu đã đọc");
        } catch (error) {
            toast.error("Không thể cập nhật thông báo");
        }
    };

    const handleMarkAsUnread = async (notification) => {
        try {
            await adminNotificationService.markAsUnread(notification.id);
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? { ...item, is_read: false, read_at: null }
                        : item
                )
            );
            toast.success("Đã đánh dấu chưa đọc");
        } catch (error) {
            toast.error("Không thể cập nhật thông báo");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await adminNotificationService.markAllAsRead();
            await markAllAsRead();
            await fetchNotifications(pagination.current_page);
            toast.success("Đã đánh dấu tất cả đã đọc");
        } catch (error) {
            toast.error("Không thể cập nhật thông báo");
        }
    };

    const handlePageChange = (page) => {
        fetchNotifications(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const unreadNotifications = notifications.filter((n) => !n.is_read).length;

    return (
        <div className="notifications-page">
            <div className="notifications-page__container">
                {/* Header */}
                <div className="notifications-page__header">
                    <div>
                        <h1 className="notifications-page__title">
                            <Bell size={28} />
                            Quản lý thông báo
                        </h1>
                        <p className="notifications-page__subtitle">
                            Quản lý và theo dõi tất cả thông báo hệ thống
                        </p>
                    </div>
                    {unreadNotifications > 0 && (
                        <button
                            className="notifications-page__mark-all-btn"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck size={18} />
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="notifications-page__stats">
                    <div className="notifications-page__stat">
                        <div className="notifications-page__stat-label">Tổng số</div>
                        <div className="notifications-page__stat-value">
                            {pagination.total}
                        </div>
                    </div>
                    <div className="notifications-page__stat notifications-page__stat--unread">
                        <div className="notifications-page__stat-label">Chưa đọc</div>
                        <div className="notifications-page__stat-value">
                            {unreadCount}
                        </div>
                    </div>
                    <div className="notifications-page__stat notifications-page__stat--read">
                        <div className="notifications-page__stat-label">Đã đọc</div>
                        <div className="notifications-page__stat-value">
                            {pagination.total - unreadCount}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="notifications-page__filters">
                    <div className="notifications-page__filter-tabs">
                        <button
                            className={`notifications-page__filter-tab ${
                                activeFilter === "all" ? "active" : ""
                            }`}
                            onClick={() => handleFilterChange("all")}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`notifications-page__filter-tab ${
                                activeFilter === "unread" ? "active" : ""
                            }`}
                            onClick={() => handleFilterChange("unread")}
                        >
                            <Circle size={14} />
                            Chưa đọc ({unreadCount})
                        </button>
                        <button
                            className={`notifications-page__filter-tab ${
                                activeFilter === "read" ? "active" : ""
                            }`}
                            onClick={() => handleFilterChange("read")}
                        >
                            <CheckCircle2 size={14} />
                            Đã đọc
                        </button>
                    </div>

                    <div className="notifications-page__search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thông báo..."
                            value={filters.search}
                            onChange={handleSearch}
                        />
                        {filters.search && (
                            <button
                                className="notifications-page__search-clear"
                                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="notifications-page__content">
                    {loading ? (
                        <div className="notifications-page__loading">
                            <RefreshCw size={24} className="spinning" />
                            <p>Đang tải thông báo...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="notifications-page__empty">
                            <Bell size={48} />
                            <h3>Không có thông báo</h3>
                            <p>
                                {filters.search || activeFilter !== "all"
                                    ? "Không tìm thấy thông báo phù hợp với bộ lọc"
                                    : "Chưa có thông báo nào"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="notifications-page__list">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notifications-page__item ${
                                            !notification.is_read
                                                ? "notifications-page__item--unread"
                                                : ""
                                        }`}
                                    >
                                        <div className="notifications-page__item-icon">
                                            {notification.is_read ? (
                                                <CheckCircle2 size={20} />
                                            ) : (
                                                <Circle size={20} />
                                            )}
                                        </div>
                                        <div className="notifications-page__item-content">
                                            <div className="notifications-page__item-header">
                                                <h3 className="notifications-page__item-title">
                                                    {notification.title}
                                                </h3>
                                                <div className="notifications-page__item-actions">
                                                    {notification.is_read ? (
                                                        <button
                                                            className="notifications-page__item-action"
                                                            onClick={() =>
                                                                handleMarkAsUnread(notification)
                                                            }
                                                            title="Đánh dấu chưa đọc"
                                                        >
                                                            <Circle size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="notifications-page__item-action"
                                                            onClick={() =>
                                                                handleMarkAsRead(notification)
                                                            }
                                                            title="Đánh dấu đã đọc"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="notifications-page__item-message">
                                                {notification.message}
                                            </p>
                                            <div className="notifications-page__item-footer">
                                                <span className="notifications-page__item-time">
                                                    {dayjs(notification.created_at).fromNow()}
                                                </span>
                                                {notification.total_price && (
                                                    <span className="notifications-page__item-price">
                                                        {new Intl.NumberFormat("vi-VN", {
                                                            style: "currency",
                                                            currency: "VND",
                                                        }).format(notification.total_price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="notifications-page__pagination">
                                    <button
                                        className="notifications-page__pagination-btn"
                                        onClick={() =>
                                            handlePageChange(pagination.current_page - 1)
                                        }
                                        disabled={pagination.current_page === 1}
                                    >
                                        <ChevronLeft size={18} />
                                        Trước
                                    </button>
                                    <div className="notifications-page__pagination-info">
                                        Trang {pagination.current_page} / {pagination.last_page}
                                    </div>
                                    <button
                                        className="notifications-page__pagination-btn"
                                        onClick={() =>
                                            handlePageChange(pagination.current_page + 1)
                                        }
                                        disabled={pagination.current_page === pagination.last_page}
                                    >
                                        Sau
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;

