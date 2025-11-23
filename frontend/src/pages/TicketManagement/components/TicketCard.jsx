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
                <div className="ticket-card__code">
                    Mã vé: {ticket.code || ticket.id || "N/A"}
                </div>
                <div className="ticket-card__route">
                    <Send className="ticket-card__icon" size={16} />
                    <span>
                        {ticket.from || "Điểm đi"} - {ticket.to || "Điểm đến"}
                    </span>
                </div>
                <div className="ticket-card__datetime">
                    <Clock className="ticket-card__icon" size={16} />
                    <span>
                        {formatTime(ticket.departure_time)} {formatDate(ticket.departure_date)}
                    </span>
                </div>
                <div className="ticket-card__bus-type">
                    <Bus className="ticket-card__icon" size={16} />
                    <span>{ticket.bus_type || "GIƯỜNG NẰM"}</span>
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
