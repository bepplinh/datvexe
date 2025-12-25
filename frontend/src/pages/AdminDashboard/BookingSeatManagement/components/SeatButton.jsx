import React from "react";
import { getSeatClassName } from "./seatMapUtils";
import "./SeatMap.scss";

const SeatButton = ({
    seat,
    isSelected,
    highlightedSeats = [],
    onClick,
    style = {},
}) => {
    const status = isSelected ? "selected" : seat.status;
    const className = getSeatClassName(status, seat.label, highlightedSeats);

    const handleClick = () => {
        if (onClick) {
            onClick(seat.label);
        }
    };

    const tooltip = seat.booking_info
        ? `Đã đặt bởi: ${seat.booking_info.passenger_name} - Mã: ${seat.booking_info.booking_code || "N/A"}`
        : `Ghế ${seat.label}`;

    return (
        <button
            onClick={handleClick}
            className={className}
            style={style}
            title={tooltip}
            aria-label={`Ghế ${seat.label}`}
        >
            <span className="seat-map__seat-label">{seat.label}</span>
            {seat.booking_info && (
                <span className="seat-map__seat-badge">Đ</span>
            )}
        </button>
    );
};

export default SeatButton;

