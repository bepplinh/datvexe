import React from "react";
import { getRouteCityName } from "../../../../utils/route";
import "./TripCard.scss";

const TripCard = ({ trip, onClick, isSelected = false }) => {
    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return "N/A";
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return "N/A";
        const date = new Date(dateTimeString);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "scheduled":
                return "Đã lên lịch";
            case "running":
                return "Đang chạy";
            case "completed":
                return "Hoàn thành";
            case "cancelled":
                return "Đã hủy";
            default:
                return status;
        }
    };

    return (
        <div
            className={`trip-card ${isSelected ? "trip-card--selected" : ""}`}
            onClick={() => onClick && onClick(trip)}
        >
            <div className="trip-card__header">
                <span className="trip-card__time">
                    {formatTime(trip.departure_time)}
                </span>
                <span
                    className={`trip-card__status trip-card__status--${trip.status}`}
                >
                    {getStatusLabel(trip.status)}
                </span>
            </div>
            <div className="trip-card__body">
                <div className="trip-card__info">
                    <span className="trip-card__label">Tuyến:</span>
                    <span className="trip-card__value">
                        {trip.route?.name ||
                            `${getRouteCityName(
                                trip.route,
                                "from"
                            )} → ${getRouteCityName(trip.route, "to")}`}
                    </span>
                </div>
                <div className="trip-card__info">
                    <span className="trip-card__label">Khởi hành:</span>
                    <span className="trip-card__value">
                        {formatDateTime(trip.departure_time)}
                    </span>
                </div>
                {trip.bus && (
                    <div className="trip-card__info">
                        <span className="trip-card__label">Xe:</span>
                        <span className="trip-card__value">
                            {trip.bus.license_plate}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripCard;

