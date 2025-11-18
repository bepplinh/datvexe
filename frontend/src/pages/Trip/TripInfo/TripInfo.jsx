import React, { useState } from "react";
import "./TripInfo.scss";
import BookSeat from "../../../components/BookSeat/BookSeat";

export default function TripInfo({ trip, onSelect }) {
    const [showBookSeat, setShowBookSeat] = useState(false);
    if (!trip) {
        return null;
    }

    const formatPrice = (price) => {
        if (!price) return "0đ";
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const getBusInitials = (busName) => {
        if (!busName) return "NS";
        const words = busName.split(" ");
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return busName.substring(0, 2).toUpperCase();
    };

    // 2. Hàm tính phần trăm ghế an toàn (tránh chia cho 0)
    const calculateSeatPercentage = () => {
        const total = trip.total_seats || 0;
        const available = trip.available_seats || 0;
        if (total === 0) return 0; // Tránh lỗi chia cho 0

        const percent = ((total - available) / total) * 100;
        return Math.max(0, Math.min(100, Math.round(percent)));
    };

    return (
        <div className="overlay">
            <div className="vector">{getBusInitials(trip.bus?.name)}</div>

            <div className="container">
                <div className="heading4">
                    <p className="xeNgCsn">{trip.bus?.name || "N/A"}&nbsp;</p>
                    <div className="background">
                        <p className="a455">4.5/5*</p>
                    </div>
                </div>

                <div className="backgroundBorder">
                    <p className="xe22PhNgVip">
                        {trip.bus?.type || trip.route_name || "N/A"}
                    </p>
                </div>

                <div className="heading6">
                    <svg className="icClockSvg" viewBox="0 0 24 24">
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="#2d2d2f"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M12 7v5l3 2"
                            fill="none"
                            stroke="#2d2d2f"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    <p className="khIhNh0230">
                        Khởi hành {trip.departure_time || "N/A"}
                    </p>
                </div>

                <p className="aGiKhIhNhTNhTThXuN">
                    * Giờ khởi hành tính từ {trip.from_location || "N/A"}
                </p>
            </div>

            <div className="container4">
                <p className="a0230">{trip.departure_time || "N/A"}</p>
                <div className="container3">
                    <div className="container2">
                        <p className="a2H45M">{trip.duration_text || "N/A"}</p>
                    </div>
                    <div className="horizontalDivider" />
                </div>
                <p className="a0515">{trip.arrival_time || "N/A"}</p>
            </div>

            <div className="verticalDivider" />
            <div className="verticalDivider2" />

            <div className="container5">
                <p className="a180000">{formatPrice(trip.price)}</p>
                {/* 3. Gắn sự kiện onClick cho nút Đặt vé */}
                <div
                    className="button"
                    onClick={() => {
                        console.log(
                            "trip_id khi bấm Đặt vé:",
                            trip.trip_id,
                            trip
                        );
                        setShowBookSeat(true);
                        if (onSelect) onSelect(trip);
                    }}
                    style={{ cursor: "pointer" }}
                >
                    <p className="aTv">Đặt vé</p>
                </div>
            </div>

            <div className="container6">
                <p className="cN2222Ch3">
                    <span className="cN2222Ch">Còn&nbsp;</span>
                    <span className="cN2222Ch2">
                        {trip.available_seats || 0}
                    </span>
                    <span className="cN2222Ch">
                        /{trip.total_seats || 0} chỗ
                    </span>
                </p>

                <div className="background2">
                    <div
                        className="backgroundFill"
                        style={{
                            width: `${calculateSeatPercentage()}%`,
                        }}
                    />
                </div>
            </div>

            {showBookSeat && (
                <BookSeat trip={trip} onClose={() => setShowBookSeat(false)} />
            )}
        </div>
    );
}
