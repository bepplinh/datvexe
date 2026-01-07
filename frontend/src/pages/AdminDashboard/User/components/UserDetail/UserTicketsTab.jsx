import React from "react";
import { formatCurrency } from "../../../../../utils/formatCurrency";

export const UserTicketsTab = ({ userTickets, loadingTickets }) => {
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

    if (loadingTickets) {
        return <div className="user-detail__loading">Đang tải...</div>;
    }

    if (userTickets.length === 0) {
        return <div className="user-detail__empty">Người dùng này chưa có vé nào</div>;
    }

    return (
        <div className="user-detail__tickets">
            <div className="user-detail__ticket-list">
                {userTickets.map((ticket) => {
                    const statusBadge = getStatusBadge(ticket.status);
                    return (
                        <div key={ticket.id} className="user-detail__ticket-item">
                            <div className="user-detail__ticket-header">
                                <span className="user-detail__ticket-code">
                                    Mã: {ticket.code || ticket.id}
                                </span>
                                <span className={`user-detail__ticket-status ${statusBadge.class}`}>
                                    {statusBadge.text}
                                </span>
                            </div>
                            <div className="user-detail__ticket-route">
                                {ticket.origin_location || "Điểm đi"} →{" "}
                                {ticket.destination_location || "Điểm đến"}
                            </div>
                            <div className="user-detail__ticket-footer">
                                <span className="user-detail__ticket-date">
                                    {formatDate(ticket.created_at)}
                                </span>
                                <span className="user-detail__ticket-price">
                                    {formatCurrency(ticket.total_price || 0)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
