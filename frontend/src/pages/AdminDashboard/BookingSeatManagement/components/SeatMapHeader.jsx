import React from "react";
import "./SeatMap.scss";

const SeatMapHeader = ({ trip, onClose }) => {
    if (!trip) return null;

    const busName = trip?.bus?.name || trip?.bus?.license_plate || "NHÀ XE";

    return (
        <div className="seat-map__header">
            <div className="seat-map__header-info">
                <h3 className="seat-map__title">
                    {busName}
                    {trip.route && (
                        <span>
                            {" "}
                            - {trip.route.name ||
                                `${trip.route.from_city?.name || ""} → ${trip.route.to_city?.name || ""
                                }`}
                        </span>
                    )}
                </h3>
            </div>
            {onClose && (
                <button
                    className="seat-map__close-btn"
                    onClick={onClose}
                    type="button"
                >
                    ✕
                </button>
            )}

            {/* Chú thích màu sắc */}
            <div className="seat-map__legend">
                <div className="seat-map__legend-item">
                    <div className="seat-map__legend-icon seat-map__legend-icon--available"></div>
                    <span className="seat-map__legend-text">Ghế trống</span>
                </div>
                <div className="seat-map__legend-item">
                    <div className="seat-map__legend-icon seat-map__legend-icon--locked"></div>
                    <span className="seat-map__legend-text">Đang giữ chỗ</span>
                </div>
                <div className="seat-map__legend-item">
                    <div className="seat-map__legend-icon seat-map__legend-icon--selected"></div>
                    <span className="seat-map__legend-text">Đang chọn</span>
                </div>
                <div className="seat-map__legend-item">
                    <div className="seat-map__legend-icon seat-map__legend-icon--booked"></div>
                    <span className="seat-map__legend-text">Đã bán</span>
                </div>
            </div>
        </div>
    );
};

export default SeatMapHeader;

