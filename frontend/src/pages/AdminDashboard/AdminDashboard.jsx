import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Ticket,
    Bus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    MessageCircle,
    RefreshCw,
    CreditCard,
    Tag,
    Star,
    Loader2,
    Route as RouteIcon,
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight
} from "lucide-react";
import { revenueService } from "../../services/admin/revenueService";
import apiClient from "../../apis/axiosClient";
import "./AdminDashboard.scss";

function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [error, setError] = useState(null);

    // Format số tiền thành chuỗi dễ đọc
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return "0đ";
        if (value >= 1e9) {
            return `${(value / 1e9).toFixed(1)} tỷ`;
        }
        if (value >= 1e6) {
            return `${(value / 1e6).toFixed(1)} triệu`;
        }
        if (value >= 1e3) {
            return `${(value / 1e3).toFixed(0)}k`;
        }
        return `${value.toLocaleString("vi-VN")}đ`;
    };

    // Format phần trăm thay đổi
    const formatChange = (change) => {
        if (change === undefined || change === null) return null;
        const sign = change >= 0 ? "+" : "";
        return `${sign}${change.toFixed(1)}%`;
    };

    // Format thời gian relative
    const formatRelativeTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${diffDays} ngày trước`;
    };

    // Lấy dữ liệu dashboard
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await revenueService.getDashboard({ period: "day" });
            setDashboardData(response);
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    // Lấy hoạt động gần đây (bookings)
    const fetchRecentActivities = async () => {
        try {
            setActivitiesLoading(true);
            const response = await apiClient.get("/admin/bookings", {
                params: { per_page: 5 }
            });

            if (response.data?.data?.data) {
                const bookings = response.data.data.data;
                const activities = bookings.map((booking) => {
                    let status = "success";
                    let message = "";
                    let icon = CheckCircle;

                    const route = booking.legs?.[0]?.trip?.route;
                    const routeName = route
                        ? `${route.from_city || ""} → ${route.to_city || ""}`
                        : "N/A";

                    if (booking.status === "cancelled") {
                        status = "error";
                        icon = XCircle;
                        message = `${booking.passenger_name || "Khách"} đã huỷ vé ${routeName}`;
                    } else if (booking.status === "paid") {
                        status = "success";
                        icon = CheckCircle;
                        message = `${booking.passenger_name || "Khách"} đặt vé ${routeName}`;
                    } else if (booking.status === "pending") {
                        status = "warning";
                        icon = Clock;
                        message = `${booking.passenger_name || "Khách"} đang chờ thanh toán ${routeName}`;
                    } else {
                        status = "info";
                        icon = Ticket;
                        message = `Đơn #${booking.code} - ${booking.status}`;
                    }

                    return {
                        id: booking.id,
                        type: booking.status,
                        message,
                        time: formatRelativeTime(booking.created_at),
                        status,
                        icon,
                        amount: booking.total_price,
                        code: booking.code
                    };
                });
                setRecentActivities(activities);
            }
        } catch (err) {
            console.error("Failed to fetch recent activities:", err);
        } finally {
            setActivitiesLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchRecentActivities();
    }, []);

    const handleRefresh = () => {
        fetchDashboardData();
        fetchRecentActivities();
    };

    // Stat cards dựa trên dữ liệu thực
    const getStatCards = () => {
        if (!dashboardData?.data) return [];

        const { current_period, previous_period, comparison } = dashboardData.data;

        return [
            {
                id: "revenue",
                title: "Doanh thu hôm nay",
                value: formatCurrency(current_period?.revenue),
                change: formatChange(comparison?.revenue_change),
                trend: comparison?.revenue_change >= 0 ? "up" : "down",
                icon: DollarSign,
                color: "orange",
            },
            {
                id: "bookings",
                title: "Đơn đặt vé hôm nay",
                value: current_period?.booking_count?.toLocaleString("vi-VN") || "0",
                change: formatChange(comparison?.booking_change),
                trend: comparison?.booking_change >= 0 ? "up" : "down",
                icon: Ticket,
                color: "green",
            },
            {
                id: "prev_revenue",
                title: "Doanh thu hôm qua",
                value: formatCurrency(previous_period?.revenue),
                change: null,
                trend: "up",
                icon: CreditCard,
                color: "blue",
            },
            {
                id: "prev_bookings",
                title: "Đơn đặt vé hôm qua",
                value: previous_period?.booking_count?.toLocaleString("vi-VN") || "0",
                change: null,
                trend: "up",
                icon: Calendar,
                color: "purple",
            },
        ];
    };

    // Quick Links
    const QUICK_LINKS = [
        { id: "bookings", label: "Đặt vé", icon: Ticket, path: "/admin/bookings" },
        { id: "trips", label: "Chuyến xe", icon: Calendar, path: "/admin/trips" },
        { id: "users", label: "Người dùng", icon: Users, path: "/admin/users" },
        { id: "revenue", label: "Doanh thu", icon: DollarSign, path: "/admin/revenue" },
        { id: "routes", label: "Tuyến đường", icon: RouteIcon, path: "/admin/routes" },
        { id: "buses", label: "Xe", icon: Bus, path: "/admin/buses" },
        { id: "coupons", label: "Khuyến mãi", icon: Tag, path: "/admin/coupons" },
        { id: "chat", label: "Hỗ trợ", icon: MessageCircle, path: "/admin/chat" },
    ];

    const statCards = getStatCards();

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="admin-dashboard__header">
                <div>
                    <h1 className="admin-dashboard__title">Tổng quan</h1>
                    <p className="admin-dashboard__subtitle">
                        Chào mừng trở lại! Đây là tổng quan về hệ thống của bạn.
                    </p>
                </div>
                <div className="admin-dashboard__actions">
                    <button
                        className="admin-dashboard__btn admin-dashboard__btn--primary"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 size={18} className="spin" />
                        ) : (
                            <RefreshCw size={18} />
                        )}
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="admin-dashboard__error">
                    {error}
                    <button onClick={handleRefresh}>Thử lại</button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="admin-dashboard__stats">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="admin-stat-card admin-stat-card--loading">
                            <div className="admin-stat-card__skeleton-icon" />
                            <div className="admin-stat-card__content">
                                <div className="admin-stat-card__skeleton-label" />
                                <div className="admin-stat-card__skeleton-value" />
                                <div className="admin-stat-card__skeleton-change" />
                            </div>
                        </div>
                    ))
                ) : (
                    statCards.map((stat) => {
                        const Icon = stat.icon;
                        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
                        return (
                            <div
                                key={stat.id}
                                className={`admin-stat-card admin-stat-card--${stat.color}`}
                            >
                                <div className="admin-stat-card__icon">
                                    <Icon size={24} />
                                </div>
                                <div className="admin-stat-card__content">
                                    <div className="admin-stat-card__label">
                                        {stat.title}
                                    </div>
                                    <div className="admin-stat-card__value">
                                        {stat.value}
                                    </div>
                                    {stat.change && (
                                        <div
                                            className={`admin-stat-card__change admin-stat-card__change--${stat.trend}`}
                                        >
                                            <TrendIcon size={14} />
                                            <span>{stat.change}</span>
                                            <span className="admin-stat-card__change-label">
                                                so với hôm qua
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Content Grid */}
            <div className="admin-dashboard__grid">
                {/* Recent Activities */}
                <div className="admin-dashboard__card">
                    <div className="admin-dashboard__card-header">
                        <h2 className="admin-dashboard__card-title">
                            Hoạt động gần đây
                        </h2>
                        <button
                            className="admin-dashboard__card-action"
                            onClick={() => navigate("/admin/bookings")}
                        >
                            Xem tất cả
                        </button>
                    </div>
                    <div className="admin-dashboard__card-body">
                        {activitiesLoading ? (
                            <div className="admin-activity-list">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="admin-activity-item admin-activity-item--loading">
                                        <div className="admin-activity-item__skeleton-icon" />
                                        <div className="admin-activity-item__content">
                                            <div className="admin-activity-item__skeleton-message" />
                                            <div className="admin-activity-item__skeleton-time" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentActivities.length > 0 ? (
                            <div className="admin-activity-list">
                                {recentActivities.map((activity) => {
                                    const Icon = activity.icon;
                                    return (
                                        <div
                                            key={activity.id}
                                            className={`admin-activity-item admin-activity-item--${activity.status}`}
                                            onClick={() => navigate(`/admin/bookings`)}
                                        >
                                            <div className="admin-activity-item__icon">
                                                <Icon size={16} />
                                            </div>
                                            <div className="admin-activity-item__content">
                                                <div className="admin-activity-item__message">
                                                    {activity.message}
                                                </div>
                                                <div className="admin-activity-item__meta">
                                                    <span className="admin-activity-item__time">
                                                        {activity.time}
                                                    </span>
                                                    {activity.amount > 0 && (
                                                        <span className="admin-activity-item__amount">
                                                            {formatCurrency(activity.amount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="admin-activity-item__arrow" />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="admin-dashboard__empty">
                                Chưa có hoạt động nào
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="admin-dashboard__card">
                    <div className="admin-dashboard__card-header">
                        <h2 className="admin-dashboard__card-title">
                            Truy cập nhanh
                        </h2>
                    </div>
                    <div className="admin-dashboard__card-body">
                        <div className="admin-quick-links">
                            {QUICK_LINKS.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <button
                                        key={link.id}
                                        className="admin-quick-link"
                                        onClick={() => navigate(link.path)}
                                    >
                                        <Icon size={20} />
                                        <span>{link.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="admin-dashboard__card admin-dashboard__card--full">
                <div className="admin-dashboard__card-header">
                    <h2 className="admin-dashboard__card-title">
                        Các tính năng quản lý
                    </h2>
                </div>
                <div className="admin-dashboard__card-body">
                    <div className="admin-feature-grid">
                        <div
                            className="admin-feature-item"
                            onClick={() => navigate("/admin/revenue")}
                        >
                            <DollarSign size={24} />
                            <div className="admin-feature-item__content">
                                <h3>Báo cáo doanh thu</h3>
                                <p>Xem biểu đồ, xu hướng và phân tích chi tiết</p>
                            </div>
                        </div>
                        <div
                            className="admin-feature-item"
                            onClick={() => navigate("/admin/bookings")}
                        >
                            <Ticket size={24} />
                            <div className="admin-feature-item__content">
                                <h3>Quản lý đặt vé</h3>
                                <p>Tạo vé, thay đổi chỗ ngồi, hoàn tiền</p>
                            </div>
                        </div>
                        <div
                            className="admin-feature-item"
                            onClick={() => navigate("/admin/trips")}
                        >
                            <Calendar size={24} />
                            <div className="admin-feature-item__content">
                                <h3>Quản lý chuyến xe</h3>
                                <p>Tạo và quản lý các chuyến xe</p>
                            </div>
                        </div>
                        <div
                            className="admin-feature-item"
                            onClick={() => navigate("/admin/chat")}
                        >
                            <MessageCircle size={24} />
                            <div className="admin-feature-item__content">
                                <h3>Hỗ trợ khách hàng</h3>
                                <p>Chat trực tiếp với khách hàng</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
