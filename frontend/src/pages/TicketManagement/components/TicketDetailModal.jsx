import React from "react";
import { formatCurrency } from "../../../utils/formatCurrency";
import "./TicketCard.scss";

const TicketDetailModal = ({ ticket, onClose }) => {
    if (!ticket) return null;

    const booking = ticket.raw || ticket; // phòng trường hợp sau này bạn truyền cả booking gốc
    const legs = Array.isArray(booking.legs) ? booking.legs : [];

    const outLegs = legs.filter((l) => l.leg_type === "OUT");
    const returnLegs = legs.filter((l) => l.leg_type === "RETURN");

    const formatDateTime = (dt) => {
        if (!dt) return "";
        const d = new Date(dt);
        return d.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getBookingStatusBadge = (status) => {
        if (!status) return null;

        const statusLower = status.toLowerCase();
        let badgeClass = "ticket-detail__badge-status";
        let badgeText = "";

        if (statusLower === "paid" || statusLower === "đã thanh toán") {
            badgeClass += " ticket-detail__badge-status--paid";
            badgeText = "Đã thanh toán";
        } else if (statusLower === "pending" || statusLower === "đang chờ") {
            badgeClass += " ticket-detail__badge-status--pending";
            badgeText = "Đang chờ";
        } else if (statusLower === "cancelled" || statusLower === "đã hủy") {
            badgeClass += " ticket-detail__badge-status--cancelled";
            badgeText = "Đã hủy";
        } else if (statusLower === "confirmed" || statusLower === "đã xác nhận") {
            badgeClass += " ticket-detail__badge-status--confirmed";
            badgeText = "Đã xác nhận";
        } else if (statusLower === "expired" || statusLower === "hết hạn") {
            badgeClass += " ticket-detail__badge-status--expired";
            badgeText = "Hết hạn";
        } else {
            badgeClass += " ticket-detail__badge-status--default";
            badgeText = status;
        }

        return { badgeClass, badgeText };
    };

    const bookingStatusBadge = getBookingStatusBadge(booking.status);

    const renderLegSection = (title, data) => {
        if (!data.length) return null;

        return (
            <div className="ticket-detail__leg">
                <h3 className="ticket-detail__leg-title">{title}</h3>
                {data.map((leg) => (
                    <div key={leg.id} className="ticket-detail__leg-item">
                        <div className="ticket-detail__row">
                            <span className="ticket-detail__label">Tuyến:</span>
                            <span className="ticket-detail__value">
                                {leg.pickup_location.name || "Điểm đón"} →{" "}
                                {leg.dropoff_location.name || "Điểm trả"}
                            </span>
                        </div>
                        <div className="ticket-detail__row">
                            <span className="ticket-detail__label">
                                Điểm đón:
                            </span>
                            <span className="ticket-detail__value">
                                {leg.pickup_address ||
                                    leg.pickup_location?.address ||
                                    "N/A"}
                            </span>
                        </div>
                        <div className="ticket-detail__row">
                            <span className="ticket-detail__label">
                                Điểm trả:
                            </span>
                            <span className="ticket-detail__value">
                                {leg.dropoff_address ||
                                    leg.dropoff_location?.address ||
                                    "N/A"}
                            </span>
                        </div>
                        <div className="ticket-detail__row">
                            <span className="ticket-detail__label">
                                Giờ khởi hành:
                            </span>
                            <span className="ticket-detail__value">
                                {formatDateTime(leg.trip?.departure_time)}
                            </span>
                        </div>
                        <div className="ticket-detail__row ticket-detail__row--seats">
                            <span className="ticket-detail__label">Ghế:</span>
                            <div className="ticket-detail__seats">
                                {(leg.items || []).length === 0 ? (
                                    <span className="ticket-detail__seat ticket-detail__seat--empty">
                                        Không có dữ liệu
                                    </span>
                                ) : (
                                    (leg.items || []).map((item) => {
                                        const label =
                                            item.seat_label ||
                                            item.seat?.seat_number ||
                                            "N/A";
                                        return (
                                            <span
                                                key={`seat-${leg.id}-${label}`}
                                                className="ticket-detail__seat"
                                            >
                                                {label}
                                            </span>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="ticket-detail__row">
                            <span className="ticket-detail__label">
                                Giá chặng:
                            </span>
                            <span className="ticket-detail__value">
                                {formatCurrency(leg.total_price || 0)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="ticket-detail-modal__backdrop" onClick={onClose}>
            <div
                className="ticket-detail-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ticket-detail__header">
                    <div className="ticket-detail__header-content">
                        <div className="ticket-detail__header-title-row">
                            <h2>Chi tiết vé #{booking.code || ticket.code}</h2>
                            {bookingStatusBadge && (
                                <span className={bookingStatusBadge.badgeClass}>
                                    {bookingStatusBadge.badgeText}
                                </span>
                            )}
                        </div>
                        <p className="ticket-detail__subtitle">
                            Hiển thị thông tin chiều đi / chiều về và ghế đã đặt
                        </p>
                    </div>
                    <button
                        className="ticket-detail__close-btn"
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="ticket-detail__body">
                    <div className="ticket-detail__summary">
                        <div className="ticket-detail__summary-info">
                            <div className="ticket-detail__row">
                                <span className="ticket-detail__label">Mã vé:</span>
                                <span className="ticket-detail__value ticket-detail__value--code">
                                    {booking.code}
                                </span>
                            </div>
                        </div>

                        <div className="ticket-detail__summary-pricing">
                            <div className="ticket-detail__pricing-header">
                                <span className="ticket-detail__pricing-title">
                                    Thông tin thanh toán
                                </span>
                            </div>
                            <div className="ticket-detail__pricing-content">
                                {booking.discount_amount &&
                                    parseFloat(booking.discount_amount) > 0 ? (
                                    <>
                                        <div className="ticket-detail__pricing-row">
                                            <span className="ticket-detail__pricing-label">
                                                Tạm tính:
                                            </span>
                                            <span className="ticket-detail__pricing-value">
                                                {formatCurrency(
                                                    booking.subtotal_price ||
                                                    booking.total_price ||
                                                    0
                                                )}
                                            </span>
                                        </div>
                                        <div className="ticket-detail__pricing-row ticket-detail__pricing-row--discount">
                                            <span className="ticket-detail__pricing-label">
                                                Giảm giá:
                                            </span>
                                            <span className="ticket-detail__pricing-value ticket-detail__pricing-value--discount">
                                                -{formatCurrency(
                                                    booking.discount_amount || 0
                                                )}
                                            </span>
                                        </div>
                                        <div className="ticket-detail__pricing-divider"></div>
                                        <div className="ticket-detail__pricing-row ticket-detail__pricing-row--total">
                                            <span className="ticket-detail__pricing-label">
                                                Tổng tiền:
                                            </span>
                                            <span className="ticket-detail__pricing-value ticket-detail__pricing-value--total">
                                                {formatCurrency(booking.total_price || 0)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="ticket-detail__pricing-row ticket-detail__pricing-row--total">
                                        <span className="ticket-detail__pricing-label">
                                            Tổng tiền:
                                        </span>
                                        <span className="ticket-detail__pricing-value ticket-detail__pricing-value--total">
                                            {formatCurrency(booking.total_price || 0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {legs.length === 0 ? (
                        <div className="ticket-detail__leg">
                            <p className="ticket-detail__value">
                                Không tìm thấy thông tin chặng cho vé này.
                            </p>
                        </div>
                    ) : (
                        <>
                            {renderLegSection("Chiều đi", outLegs)}
                            {renderLegSection("Chiều về", returnLegs)}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketDetailModal;
