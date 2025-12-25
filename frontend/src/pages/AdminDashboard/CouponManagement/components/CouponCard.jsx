import React from "react";
import { Edit, Trash2, Power, Calendar, Percent, DollarSign, Users, Tag } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatCurrency";
import "./CouponCard.scss";

const CouponCard = ({
    coupon,
    onClick,
    onEdit,
    onDelete,
    onToggleActive,
}) => {
    const formatDateTime = (dateString) => {
        if (!dateString) return "Không giới hạn";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatus = () => {
        if (!coupon.is_active) {
            return { text: "Tạm ngưng", class: "status-inactive" };
        }

        const now = new Date();
        const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
        const endDate = coupon.end_date ? new Date(coupon.end_date) : null;

        if (startDate && now < startDate) {
            return { text: "Chưa bắt đầu", class: "status-pending" };
        }

        if (endDate && now > endDate) {
            return { text: "Hết hạn", class: "status-expired" };
        }

        return { text: "Đang hoạt động", class: "status-active" };
    };

    const getDiscountDisplay = () => {
        if (coupon.discount_type === "percentage") {
            return `${coupon.discount_value}%`;
        }
        return formatCurrency(coupon.discount_value);
    };

    const status = getStatus();
    const usageCount = coupon.usages_count || 0;
    const usageLimit = coupon.usage_limit_global || "∞";

    return (
        <div
            className={`coupon-card ${status.class}`}
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
            <div className="coupon-card__header">
                <div className="coupon-card__code-section">
                    <Tag size={18} className="coupon-card__tag-icon" />
                    <div className="coupon-card__code">{coupon.code}</div>
                </div>
                <div className="coupon-card__actions">
                    <button
                        className="coupon-card__action-btn coupon-card__action-btn--edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(coupon);
                        }}
                        title="Chỉnh sửa"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className={`coupon-card__action-btn coupon-card__action-btn--toggle ${coupon.is_active
                            ? "coupon-card__action-btn--active"
                            : ""
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleActive?.(coupon);
                        }}
                        title={coupon.is_active ? "Tạm ngưng" : "Kích hoạt"}
                    >
                        <Power size={16} />
                    </button>
                    <button
                        className="coupon-card__action-btn coupon-card__action-btn--delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (
                                window.confirm(
                                    "Bạn có chắc chắn muốn xóa coupon này?"
                                )
                            ) {
                                onDelete?.(coupon.id);
                            }
                        }}
                        title="Xóa"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="coupon-card__body">
                <div className="coupon-card__discount">
                    {coupon.discount_type === "percentage" ? (
                        <Percent size={24} />
                    ) : (
                        <DollarSign size={24} />
                    )}
                    <div className="coupon-card__discount-value">
                        {getDiscountDisplay()}
                    </div>
                    {coupon.max_discount_amount &&
                        coupon.discount_type === "percentage" && (
                            <div className="coupon-card__max-discount">
                                Tối đa: {formatCurrency(coupon.max_discount_amount)}
                            </div>
                        )}
                </div>

                {coupon.description && (
                    <div className="coupon-card__description">
                        {coupon.description}
                    </div>
                )}

                <div className="coupon-card__details">
                    <div className="coupon-card__detail-item">
                        <Calendar size={16} />
                        <div>
                            <span className="coupon-card__detail-label">
                                Bắt đầu:
                            </span>
                            <span className="coupon-card__detail-value">
                                {formatDateTime(coupon.start_date)}
                            </span>
                        </div>
                    </div>

                    <div className="coupon-card__detail-item">
                        <Calendar size={16} />
                        <div>
                            <span className="coupon-card__detail-label">
                                Kết thúc:
                            </span>
                            <span className="coupon-card__detail-value">
                                {formatDateTime(coupon.end_date)}
                            </span>
                        </div>
                    </div>

                    {coupon.min_order_value && (
                        <div className="coupon-card__detail-item">
                            <DollarSign size={16} />
                            <div>
                                <span className="coupon-card__detail-label">
                                    Đơn tối thiểu:
                                </span>
                                <span className="coupon-card__detail-value">
                                    {formatCurrency(coupon.min_order_value)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="coupon-card__detail-item">
                        <Users size={16} />
                        <div>
                            <span className="coupon-card__detail-label">
                                Đã sử dụng:
                            </span>
                            <span className="coupon-card__detail-value">
                                {usageCount} / {usageLimit}
                            </span>
                        </div>
                    </div>

                    {coupon.usage_limit_per_user && (
                        <div className="coupon-card__detail-item">
                            <Users size={16} />
                            <div>
                                <span className="coupon-card__detail-label">
                                    Giới hạn/user:
                                </span>
                                <span className="coupon-card__detail-value">
                                    {coupon.usage_limit_per_user} lần
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="coupon-card__footer">
                <div className={`coupon-card__status coupon-card__status--${status.class}`}>
                    {status.text}
                </div>
            </div>
        </div>
    );
};

export default CouponCard;

