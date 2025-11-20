import React from "react";
import { formatCurrency } from "../../../utils/formatCurrency";
const LEG_LABELS = {
    OUT: "Chiều đi",
    RETURN: "Chiều về",
};

const formatDate = (value) => {
    if (!value) return "--/--/----";
    return new Date(value).toLocaleDateString("vi-VN");
};

const getLegTotal = (leg) => {
    if (typeof leg?.total_price === "number") {
        return leg.total_price;
    }

    return (leg?.seats || []).reduce((sum, seat) => sum + (seat.price || 0), 0);
};

function TicketSummary({ ticket, isLoading }) {
    const trips = ticket?.trips || [];
    const pricingTotal =
        ticket?.pricing?.total ??
        trips.reduce((sum, leg) => sum + getLegTotal(leg), 0);

    return (
        <div className="summary__card">
            <div className="summary__title">Vé của bạn</div>

            {isLoading && (
                <div className="summary__placeholder">Đang tải dữ liệu...</div>
            )}

            {!isLoading && trips.length === 0 && (
                <div className="summary__placeholder">
                    Chưa có thông tin ghế được giữ chỗ.
                </div>
            )}

            {!isLoading &&
                trips.map((leg) => (
                    <div key={leg.trip_id} className="summary__section">
                        {/* Header: Chiều đi và ngày cùng một hàng */}
                        <div className="summary__header">
                            <div className="summary__label">
                                {LEG_LABELS[leg.leg] || leg.leg || "Chuyến xe"}
                            </div>
                            <div className="summary__date">
                                {formatDate(leg.date)}
                            </div>
                        </div>

                        {/* Route: Lớn, bold */}
                        <div className="summary__route">
                            {leg?.route?.from ?? "Điểm đi"} -{" "}
                            {leg?.route?.to ?? "Điểm đến"}
                        </div>

                        {/* Details */}
                        <div className="summary__details">
                            <div className="summary__row">
                                <span>Khởi hành</span>
                                <span>{leg.departure_time || "--:--"}</span>
                            </div>
                            <div className="summary__row">
                                <span>Biển số xe</span>
                                <span>{leg.bus_plate || "Đang cập nhật"}</span>
                            </div>
                            <div className="summary__row">
                                <span>Số ghế/giường</span>
                                <span className="seat_label">
                                    {(leg.seats || [])
                                        .map((seat) => seat.label)
                                        .join(", ") || "--"}
                                </span>
                            </div>
                            <div className="summary__row">
                                <span className="summary__price-label">
                                    Giá vé:
                                </span>
                            </div>
                            {(leg.seats || []).map((seat) => (
                                <div className="summary__row" key={seat.label}>
                                    <span />
                                    <span className="price">
                                        {seat.label}:{" "}
                                        {formatCurrency(seat.price)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Giá vé cho từng leg */}
                        <div className="summary__total">
                            <div className="summary__row">
                                <span>
                                    Giá vé{" "}
                                    {LEG_LABELS[leg.leg]?.toLowerCase() ||
                                        "chuyến xe"}
                                </span>
                                <span className="price">
                                    {formatCurrency(getLegTotal(leg))}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

            {/* Tổng thanh toán */}
            {!isLoading && trips.length > 0 && (
                <div className="summary__total summary__total--grand">
                    {ticket?.pricing?.subtotal != null && (
                        <div className="summary__row">
                            <span>Tổng tiền vé</span>
                            <span className="price">
                                {formatCurrency(ticket.pricing.subtotal)}
                            </span>
                        </div>
                    )}
                    {ticket?.pricing?.discount != null &&
                        ticket.pricing.discount > 0 && (
                            <div className="summary__row">
                                <span>Giảm giá</span>
                                <span className="price discount">
                                    -{formatCurrency(ticket.pricing.discount)}
                                </span>
                            </div>
                        )}
                    <div className="summary__row">
                        <span className="summary__total-label">
                            Tổng thanh toán
                        </span>
                        <span className="price">
                            {formatCurrency(pricingTotal)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TicketSummary;
