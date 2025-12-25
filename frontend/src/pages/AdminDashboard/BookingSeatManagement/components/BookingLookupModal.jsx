import React from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import "./SeatMap.scss";
import "./BookingLookupModal.scss";

const BookingLookupModal = ({ isOpen, booking, onClose, onSelectLeg }) => {
    if (!isOpen || !booking) return null;
    console.log(booking);
    const legs = booking.legs || [];

    const getLegLabel = (legType) => {
        if (!legType) return "Chiều";
        return legType === "RETURN" ? "Chiều về" : "Chiều đi";
    };

    const handleSelect = (leg) => {
        if (onSelectLeg) {
            onSelectLeg(leg);
        }
    };

    return (
        <div
            className="seat-map__booking-modal-overlay"
            onClick={onClose}
        >
            <div
                className="seat-map__booking-modal seat-map__booking-modal--large booking-lookup-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="seat-map__booking-modal-header">
                    <div>
                        <h3>Thông tin vé - {booking.code}</h3>
                        <p className="booking-lookup-modal__subtitle">
                            {booking.passenger_name} • {booking.passenger_phone || "N/A"} •{" "}
                            {booking.passenger_email || "N/A"}
                        </p>
                    </div>
                    <button
                        className="seat-map__booking-modal-close"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <div className="seat-map__booking-modal-body booking-lookup-modal__body">
                    {legs.length === 0 ? (
                        <div className="booking-lookup-modal__empty">
                            Không tìm thấy thông tin chuyến cho mã vé này.
                        </div>
                    ) : (
                        <div className="booking-lookup-modal__legs">
                            {legs.map((leg) => {
                                const seatLabels =
                                    leg.items?.map((i) => i.seat_label).filter(Boolean) || [];

                                return (
                                    <div
                                        key={leg.id}
                                        className="booking-lookup-modal__leg-card"
                                    >
                                        <div className="booking-lookup-modal__leg-header">
                                            <span className="booking-lookup-modal__leg-badge">
                                                {getLegLabel(leg.leg_type)}
                                            </span>
                                            <span className="booking-lookup-modal__trip-id">
                                                Trip #{leg.trip_id}
                                            </span>
                                        </div>
                                        <div className="booking-lookup-modal__leg-body">
                                            {leg.departure_time && (
                                                <div className="booking-lookup-modal__time">
                                                    {new Date(leg.departure_time).toLocaleString(
                                                        "vi-VN",
                                                        {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </div>
                                            )}
                                            <div className="booking-lookup-modal__route">
                                                <span className="booking-lookup-modal__route-part">
                                                    {leg.pickup_location_name || "Điểm đón"}
                                                </span>
                                                <ArrowRight
                                                    size={16}
                                                    className="booking-lookup-modal__route-icon"
                                                />
                                                <span className="booking-lookup-modal__route-part">
                                                    {leg.dropoff_location_name || "Điểm trả"}
                                                </span>
                                            </div>
                                            <div className="booking-lookup-modal__seats">
                                                <span className="booking-lookup-modal__seats-label">
                                                    Ghế:
                                                </span>
                                                <span className="booking-lookup-modal__seats-value">
                                                    {seatLabels.length
                                                        ? seatLabels.join(", ")
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="booking-lookup-modal__actions">
                                            <button
                                                type="button"
                                                className="booking-lookup-modal__btn booking-lookup-modal__btn--primary"
                                                onClick={() => handleSelect(leg)}
                                            >
                                                <RefreshCw size={16} />
                                                <span>Xem sơ đồ & thao tác</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingLookupModal;


