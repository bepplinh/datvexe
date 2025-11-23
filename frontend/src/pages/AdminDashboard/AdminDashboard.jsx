import { 
    Users, 
    Ticket, 
    Bus, 
    TrendingUp,
    DollarSign,
    Calendar,
    AlertCircle
} from "lucide-react";
import "./AdminDashboard.scss";

const STAT_CARDS = [
    {
        id: "users",
        title: "Tổng người dùng",
        value: "12,345",
        change: "+12.5%",
        trend: "up",
        icon: Users,
        color: "blue",
    },
    {
        id: "tickets",
        title: "Vé đã bán",
        value: "8,932",
        change: "+8.2%",
        trend: "up",
        icon: Ticket,
        color: "green",
    },
    {
        id: "trips",
        title: "Chuyến xe",
        value: "456",
        change: "+5.1%",
        trend: "up",
        icon: Bus,
        color: "purple",
    },
    {
        id: "revenue",
        title: "Doanh thu",
        value: "2.5 tỷ",
        change: "+15.3%",
        trend: "up",
        icon: DollarSign,
        color: "orange",
    },
];

const RECENT_ACTIVITIES = [
    {
        id: 1,
        type: "booking",
        message: "Nguyễn Văn A đã đặt vé chuyến Hà Nội - Sài Gòn",
        time: "5 phút trước",
        status: "success",
    },
    {
        id: 2,
        type: "payment",
        message: "Thanh toán thành công cho đơn hàng #12345",
        time: "15 phút trước",
        status: "success",
    },
    {
        id: 3,
        type: "alert",
        message: "Chuyến xe #789 sắp hết chỗ",
        time: "30 phút trước",
        status: "warning",
    },
    {
        id: 4,
        type: "booking",
        message: "Trần Thị B đã hủy vé chuyến Đà Nẵng - Huế",
        time: "1 giờ trước",
        status: "error",
    },
];

function AdminDashboard() {
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
                    <button className="admin-dashboard__btn admin-dashboard__btn--primary">
                        <Calendar size={18} />
                        <span>Xem lịch</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="admin-dashboard__stats">
                {STAT_CARDS.map((stat) => {
                    const Icon = stat.icon;
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
                                <div
                                    className={`admin-stat-card__change admin-stat-card__change--${stat.trend}`}
                                >
                                    <TrendingUp size={14} />
                                    <span>{stat.change}</span>
                                    <span className="admin-stat-card__change-label">
                                        so với tháng trước
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content Grid */}
            <div className="admin-dashboard__grid">
                {/* Recent Activities */}
                <div className="admin-dashboard__card">
                    <div className="admin-dashboard__card-header">
                        <h2 className="admin-dashboard__card-title">
                            Hoạt động gần đây
                        </h2>
                        <button className="admin-dashboard__card-action">
                            Xem tất cả
                        </button>
                    </div>
                    <div className="admin-dashboard__card-body">
                        <div className="admin-activity-list">
                            {RECENT_ACTIVITIES.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`admin-activity-item admin-activity-item--${activity.status}`}
                                >
                                    <div className="admin-activity-item__icon">
                                        {activity.status === "success" && "✓"}
                                        {activity.status === "warning" && (
                                            <AlertCircle size={16} />
                                        )}
                                        {activity.status === "error" && "✕"}
                                    </div>
                                    <div className="admin-activity-item__content">
                                        <div className="admin-activity-item__message">
                                            {activity.message}
                                        </div>
                                        <div className="admin-activity-item__time">
                                            {activity.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="admin-dashboard__card">
                    <div className="admin-dashboard__card-header">
                        <h2 className="admin-dashboard__card-title">
                            Thao tác nhanh
                        </h2>
                    </div>
                    <div className="admin-dashboard__card-body">
                        <div className="admin-quick-actions">
                            <button className="admin-quick-action">
                                <Ticket size={20} />
                                <span>Tạo vé mới</span>
                            </button>
                            <button className="admin-quick-action">
                                <Bus size={20} />
                                <span>Thêm chuyến xe</span>
                            </button>
                            <button className="admin-quick-action">
                                <Users size={20} />
                                <span>Quản lý người dùng</span>
                            </button>
                            <button className="admin-quick-action">
                                <Calendar size={20} />
                                <span>Xem lịch trình</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Card */}
            <div className="admin-dashboard__card admin-dashboard__card--full">
                <div className="admin-dashboard__card-header">
                    <h2 className="admin-dashboard__card-title">
                        Thống kê nhanh
                    </h2>
                </div>
                <div className="admin-dashboard__card-body">
                    <div className="admin-stats-grid">
                        <div className="admin-stat-item">
                            <div className="admin-stat-item__label">
                                Vé đang chờ thanh toán
                            </div>
                            <div className="admin-stat-item__value">23</div>
                        </div>
                        <div className="admin-stat-item">
                            <div className="admin-stat-item__label">
                                Chuyến xe hôm nay
                            </div>
                            <div className="admin-stat-item__value">12</div>
                        </div>
                        <div className="admin-stat-item">
                            <div className="admin-stat-item__label">
                                Tỷ lệ lấp đầy trung bình
                            </div>
                            <div className="admin-stat-item__value">78%</div>
                        </div>
                        <div className="admin-stat-item">
                            <div className="admin-stat-item__label">
                                Đánh giá trung bình
                            </div>
                            <div className="admin-stat-item__value">4.5/5</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
