import React from "react";
import { Send, Clock, Bus } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";
import "./TicketCard.scss";

const TicketCard = ({ ticket, onClick }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return "";
        return timeString.substring(0, 5); // HH:mm format
    };

    const getPaymentStatusColor = (status) => {
        if (status === "paid" || status === "Đã thanh toán") {
            return "status-paid";
        }
        return "status-unpaid";
    };

    const getTicketStatusColor = (status) => {
        if (status === "departed" || status === "Đã đi") {
            return "status-departed";
        }
        if (status === "cancelled" || status === "Đã hủy") {
            return "status-cancelled";
        }
        return "status-not-departed";
    };

    const getPaymentStatusText = (status) => {
        if (status === "paid" || status === "Đã thanh toán") {
            return "Đã thanh toán";
        }
        return "Chưa thanh toán";
    };

    const getTicketStatusText = (status) => {
        if (status === "departed" || status === "Đã đi") {
            return "Đã đi";
        }
        if (status === "cancelled" || status === "Đã hủy") {
            return "Đã hủy";
        }
        return "Chưa đi";
    };

    const getBookingStatusBadge = (status) => {
        if (!status) return null;

        const statusLower = status.toLowerCase();
        let badgeClass = "ticket-card__badge-status";
        let badgeText = "";

        if (statusLower === "paid" || statusLower === "đã thanh toán") {
            badgeClass += " ticket-card__badge-status--paid";
            badgeText = "Đã thanh toán";
        } else if (statusLower === "pending" || statusLower === "đang chờ") {
            badgeClass += " ticket-card__badge-status--pending";
            badgeText = "Đang chờ";
        } else if (statusLower === "cancelled" || statusLower === "đã hủy") {
            badgeClass += " ticket-card__badge-status--cancelled";
            badgeText = "Đã hủy";
        } else if (statusLower === "confirmed" || statusLower === "đã xác nhận") {
            badgeClass += " ticket-card__badge-status--confirmed";
            badgeText = "Đã xác nhận";
        } else if (statusLower === "expired" || statusLower === "hết hạn") {
            badgeClass += " ticket-card__badge-status--expired";
            badgeText = "Hết hạn";
        } else {
            badgeClass += " ticket-card__badge-status--default";
            badgeText = status;
        }

        return { badgeClass, badgeText };
    };

    const bookingStatusBadge = getBookingStatusBadge(
        ticket.status || ticket.booking_status
    );

    return (
        <div
            className="ticket-card"
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
            <div className="ticket-card__left">
                <div className="ticket-card__code-row">
                    <div className="ticket-card__code">
                        Mã vé: {ticket.code || ticket.id || "N/A"}
                    </div>
                    <div className="ticket-card__badges">
                        {ticket.is_round_trip && (
                            <span className="ticket-card__badge-roundtrip">
                                Vé khứ hồi
                            </span>
                        )}
                        {bookingStatusBadge && (
                            <span className={bookingStatusBadge.badgeClass}>
                                {bookingStatusBadge.badgeText}
                            </span>
                        )}
                    </div>
                </div>
                <div className="ticket-card__route">
                    <Send className="ticket-card__icon" size={16} />
                    <span>
                        {ticket.from || "Điểm đi"}{" "}
                        {ticket.is_round_trip ? "⇄" : "→"}{" "}
                        {ticket.to || "Điểm đến"}
                    </span>
                </div>
                <div className="ticket-card__datetime">
                    <Clock className="ticket-card__icon" size={16} />
                    <div className="ticket-card__datetime-content">
                        <span>
                            {ticket.is_round_trip ? "Chiều đi: " : ""}
                            {formatTime(ticket.departure_time)}{" "}
                            {formatDate(ticket.departure_date)}
                        </span> <br />
                        {ticket.is_round_trip && (
                            <span className="ticket-card__datetime-return">
                                Chiều về:{" "}
                                {formatTime(ticket.return_departure_time)}{" "}
                                {formatDate(ticket.return_departure_date)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="ticket-card__bus-type">
                    <Bus className="ticket-card__icon" size={16} />
                    <div className="ticket-card__bus-type-content">
                        {ticket.is_round_trip ? (
                            <>
                                <span>
                                    Chiều đi:{" "}
                                    {ticket.bus_type || "GIƯỜNG NẰM"}
                                </span>
                                <span>
                                    Chiều về:{" "}
                                    {ticket.return_bus_type ||
                                        ticket.bus_type ||
                                        "GIƯỜNG NẰM"}
                                </span>
                            </>
                        ) : (
                            <span>{ticket.bus_type || "GIƯỜNG NẰM"}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="ticket-card__divider"></div>
            <div className="ticket-card__right">
                <div className="ticket-card__status-section">
                    <div className="ticket-card__status-label">Trạng thái</div>
                    <div className="ticket-card__status-buttons">
                        <button
                            className={`ticket-card__status-btn ${getPaymentStatusColor(
                                ticket.payment_status
                            )}`}
                        >
                            {getPaymentStatusText(ticket.payment_status)}
                        </button>
                        <button
                            className={`ticket-card__status-btn ${getTicketStatusColor(
                                ticket.ticket_status
                            )}`}
                        >
                            {getTicketStatusText(ticket.ticket_status)}
                        </button>
                    </div>
                </div>
                <div className="ticket-card__price">
                    <span className="ticket-card__price-label">Giá</span>
                    <span className="ticket-card__price-value">
                        {formatCurrency(ticket.price || ticket.total_price || 0)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
