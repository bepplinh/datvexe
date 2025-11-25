import React, { useState, useEffect, useRef } from "react";
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Shield,
    Ticket,
    DollarSign,
    Clock,
    Users,
} from "lucide-react";
import axiosClient from "../../../../apis/axiosClient";
import { formatCurrency } from "../../../../utils/formatCurrency";
import "./UserDetailModal.scss";

const UserDetailModal = ({ user, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState("info");
    const [userTickets, setUserTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [stats, setStats] = useState({
        totalTickets: 0,
        totalSpent: 0,
        favoriteRoute: "N/A",
    });
    const isMountedRef = useRef(true);
    const fetchedUserIdRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Reset fetchedUserIdRef khi user thay đổi
    useEffect(() => {
        if (user?.id !== fetchedUserIdRef.current) {
            fetchedUserIdRef.current = null;
            setUserTickets([]);
            setStats({
                totalTickets: 0,
                totalSpent: 0,
                favoriteRoute: "N/A",
            });
        }
    }, [user?.id]);

    useEffect(() => {
        // Chỉ fetch khi tab là "tickets" và chưa fetch cho user này
        if (
            user?.id &&
            activeTab === "tickets" &&
            fetchedUserIdRef.current !== user.id
        ) {
            fetchedUserIdRef.current = user.id;
            fetchUserTickets();
        }
    }, [user?.id, activeTab]);

    const fetchUserTickets = async () => {
        if (!user?.id) return;

        try {
            setLoadingTickets(true);
            const response = await axiosClient.get(
                `/bookings?user_id=${user.id}`
            );

            // Chỉ update state nếu component vẫn còn mount
            if (!isMountedRef.current) return;

            const bookings = response.data?.data?.data || [];
            setUserTickets(bookings);

            // Tính toán stats
            const totalTickets = bookings.length;
            const totalSpent = bookings.reduce(
                (sum, booking) => sum + (booking.total_price || 0),
                0
            );

            // Tìm tuyến đường yêu thích
            const routeCounts = {};
            bookings.forEach((booking) => {
                const route = `${booking.origin_location || ""} - ${
                    booking.destination_location || ""
                }`;
                routeCounts[route] = (routeCounts[route] || 0) + 1;
            });

            const favoriteRoute =
                Object.keys(routeCounts).length > 0
                    ? Object.entries(routeCounts).sort(
                          (a, b) => b[1] - a[1]
                      )[0][0]
                    : "N/A";

            setStats({
                totalTickets,
                totalSpent,
                favoriteRoute,
            });
        } catch (error) {
            console.error("Error fetching user tickets:", error);
        } finally {
            if (isMountedRef.current) {
                setLoadingTickets(false);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        if (status === "paid")
            return { text: "Đã thanh toán", class: "status-paid" };
        if (status === "cancelled")
            return { text: "Đã hủy", class: "status-cancelled" };
        return { text: "Chưa thanh toán", class: "status-unpaid" };
    };

    if (!user) return null;

    return (
        <div className="user-detail-modal__backdrop" onClick={onClose}>
            <div
                className="user-detail-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="user-detail__header">
                    <div>
                        <h2 className="user-detail__title">
                            Chi tiết người dùng
                        </h2>
                        <p className="user-detail__subtitle">ID: {user.id}</p>
                    </div>
                    <button
                        className="user-detail__close-btn"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="user-detail__tabs">
                    <button
                        className={`user-detail__tab ${
                            activeTab === "info"
                                ? "user-detail__tab--active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("info")}
                    >
                        <User size={18} />
                        Thông tin
                    </button>
                    <button
                        className={`user-detail__tab ${
                            activeTab === "tickets"
                                ? "user-detail__tab--active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("tickets")}
                    >
                        <Ticket size={18} />
                        Lịch sử đặt vé
                    </button>
                    <button
                        className={`user-detail__tab ${
                            activeTab === "stats"
                                ? "user-detail__tab--active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("stats")}
                    >
                        <DollarSign size={18} />
                        Thống kê
                    </button>
                </div>

                <div className="user-detail__body">
                    {activeTab === "info" && (
                        <div className="user-detail__info">
                            <div className="user-detail__section">
                                <h3 className="user-detail__section-title">
                                    Thông tin cơ bản
                                </h3>
                                <div className="user-detail__row">
                                    <User
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Tên
                                        </div>
                                        <div className="user-detail__value">
                                            {user.name || "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__row">
                                    <Mail
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Email
                                        </div>
                                        <div className="user-detail__value">
                                            {user.email || "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__row">
                                    <Phone
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Số điện thoại
                                        </div>
                                        <div className="user-detail__value">
                                            {user.phone || "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__row">
                                    <Calendar
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Ngày sinh
                                        </div>
                                        <div className="user-detail__value">
                                            {user.birthday
                                                ? formatDate(user.birthday)
                                                : "Chưa cập nhật"}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__row">
                                    <Users
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Giới tính
                                        </div>
                                        <div className="user-detail__value">
                                            {user.gender === "male"
                                                ? "Nam"
                                                : user.gender === "female"
                                                ? "Nữ"
                                                : user.gender === "other"
                                                ? "Khác"
                                                : "Chưa cập nhật"}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__row">
                                    <Shield
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Vai trò
                                        </div>
                                        <div className="user-detail__value">
                                            {user.role === "admin"
                                                ? "Quản trị viên"
                                                : user.role === "staff"
                                                ? "Nhân viên"
                                                : "Khách hàng"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="user-detail__section">
                                <h3 className="user-detail__section-title">
                                    Thông tin đăng ký
                                </h3>
                                <div className="user-detail__row">
                                    <Clock
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Ngày đăng ký
                                        </div>
                                        <div className="user-detail__value">
                                            {formatDate(
                                                user.created_at ||
                                                    user.createdAt
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__row">
                                    <Clock
                                        className="user-detail__icon"
                                        size={18}
                                    />
                                    <div>
                                        <div className="user-detail__label">
                                            Cập nhật lần cuối
                                        </div>
                                        <div className="user-detail__value">
                                            {formatDate(
                                                user.updated_at ||
                                                    user.updatedAt
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "tickets" && (
                        <div className="user-detail__tickets">
                            {loadingTickets ? (
                                <div className="user-detail__loading">
                                    Đang tải...
                                </div>
                            ) : userTickets.length === 0 ? (
                                <div className="user-detail__empty">
                                    Người dùng này chưa có vé nào
                                </div>
                            ) : (
                                <div className="user-detail__ticket-list">
                                    {userTickets.map((ticket) => {
                                        const statusBadge = getStatusBadge(
                                            ticket.status
                                        );
                                        return (
                                            <div
                                                key={ticket.id}
                                                className="user-detail__ticket-item"
                                            >
                                                <div className="user-detail__ticket-header">
                                                    <span className="user-detail__ticket-code">
                                                        Mã:{" "}
                                                        {ticket.code ||
                                                            ticket.id}
                                                    </span>
                                                    <span
                                                        className={`user-detail__ticket-status ${statusBadge.class}`}
                                                    >
                                                        {statusBadge.text}
                                                    </span>
                                                </div>
                                                <div className="user-detail__ticket-route">
                                                    {ticket.origin_location ||
                                                        "Điểm đi"}{" "}
                                                    →{" "}
                                                    {ticket.destination_location ||
                                                        "Điểm đến"}
                                                </div>
                                                <div className="user-detail__ticket-footer">
                                                    <span className="user-detail__ticket-date">
                                                        {formatDate(
                                                            ticket.created_at
                                                        )}
                                                    </span>
                                                    <span className="user-detail__ticket-price">
                                                        {formatCurrency(
                                                            ticket.total_price ||
                                                                0
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "stats" && (
                        <div className="user-detail__stats">
                            <div className="user-detail__stats-grid">
                                <div className="user-detail__stat-card">
                                    <Ticket
                                        className="user-detail__stat-icon"
                                        size={24}
                                    />
                                    <div className="user-detail__stat-content">
                                        <div className="user-detail__stat-label">
                                            Tổng số vé
                                        </div>
                                        <div className="user-detail__stat-value">
                                            {stats.totalTickets}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__stat-card">
                                    <DollarSign
                                        className="user-detail__stat-icon"
                                        size={24}
                                    />
                                    <div className="user-detail__stat-content">
                                        <div className="user-detail__stat-label">
                                            Tổng chi tiêu
                                        </div>
                                        <div className="user-detail__stat-value">
                                            {formatCurrency(stats.totalSpent)}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-detail__stat-card user-detail__stat-card--full">
                                    <MapPin
                                        className="user-detail__stat-icon"
                                        size={24}
                                    />
                                    <div className="user-detail__stat-content">
                                        <div className="user-detail__stat-label">
                                            Tuyến đường yêu thích
                                        </div>
                                        <div className="user-detail__stat-value">
                                            {stats.favoriteRoute}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-detail__footer">
                    <button
                        className="user-detail__btn user-detail__btn--secondary"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                    <button
                        className="user-detail__btn user-detail__btn--primary"
                        onClick={() => {
                            onEdit?.(user);
                            onClose();
                        }}
                    >
                        Chỉnh sửa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;
