import React from "react";
import {
    User,
    Mail,
    Phone,
    Calendar,
    Ticket,
    DollarSign,
    Shield,
} from "lucide-react";
import { formatCurrency } from "../../../../utils/formatCurrency";
import "./UserCard.scss";

const UserCard = ({ user, onClick, onEdit, onDelete }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "Chưa cập nhật";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getRoleBadge = (role) => {
        if (role === "admin") {
            return { text: "Quản trị viên", class: "role-admin" };
        }
        if (role === "staff") {
            return { text: "Nhân viên", class: "role-staff" };
        }
        return { text: "Khách hàng", class: "role-customer" };
    };

    const getStatusBadge = (status) => {
        if (status === "active" || status === "Active") {
            return { text: "Đang hoạt động", class: "status-active" };
        }
        if (status === "banned" || status === "Banned") {
            return { text: "Đã khóa", class: "status-banned" };
        }
        return { text: "Tạm ngưng", class: "status-inactive" };
    };

    const roleBadge = getRoleBadge(user.role);
    const statusBadge = getStatusBadge(user.status || "active");

    return (
        <div
            className="user-card"
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div className="user-card__header">
                <div className="user-card__avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-card__info">
                    <div className="user-card__name">
                        {user.name || "Chưa có tên"}
                    </div>
                    <div className="user-card__badges">
                        <span className={`user-card__badge ${roleBadge.class}`}>
                            <Shield size={12} />
                            {roleBadge.text}
                        </span>
                        <span
                            className={`user-card__badge ${statusBadge.class}`}
                        >
                            {statusBadge.text}
                        </span>
                    </div>
                </div>
            </div>

            <div className="user-card__divider"></div>

            <div className="user-card__body">
                <div className="user-card__detail">
                    <Mail className="user-card__icon" size={16} />
                    <span className="user-card__text">
                        {user.email || "N/A"}
                    </span>
                </div>
                <div className="user-card__detail">
                    <Phone className="user-card__icon" size={16} />
                    <span className="user-card__text">
                        {user.phone || "Chưa cập nhật"}
                    </span>
                </div>
                <div className="user-card__detail">
                    <Calendar className="user-card__icon" size={16} />
                    <span className="user-card__text">
                        Đăng ký: {formatDate(user.created_at || user.createdAt)}
                    </span>
                </div>
            </div>

            <div className="user-card__divider"></div>

            <div className="user-card__footer">
                <div className="user-card__stats">
                    <div className="user-card__stat">
                        <Ticket className="user-card__stat-icon" size={16} />
                        <div>
                            <div className="user-card__stat-label">Số vé</div>
                            <div className="user-card__stat-value">
                                {user.total_tickets || user.totalTickets || 0}
                            </div>
                        </div>
                    </div>
                    <div className="user-card__stat">
                        <DollarSign
                            className="user-card__stat-icon"
                            size={16}
                        />
                        <div>
                            <div className="user-card__stat-label">
                                Tổng chi tiêu
                            </div>
                            <div className="user-card__stat-value">
                                {formatCurrency(
                                    user.total_spent || user.totalSpent || 0
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="user-card__actions">
                    <button
                        className="user-card__action-btn user-card__action-btn--edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(user);
                        }}
                        title="Chỉnh sửa"
                    >
                        <User size={16} />
                    </button>
                    <button
                        className="user-card__action-btn user-card__action-btn--delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (
                                window.confirm(
                                    `Bạn có chắc muốn xóa user "${user.name}"?`
                                )
                            ) {
                                onDelete?.(user.id);
                            }
                        }}
                        title="Xóa"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;
