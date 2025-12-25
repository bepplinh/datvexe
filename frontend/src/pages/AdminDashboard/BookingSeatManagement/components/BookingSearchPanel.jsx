import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import "./BookingSearchPanel.scss";

const BookingSearchPanel = ({ seatsData, onSearchResultsChange }) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Extract all booked seats from seatsData
    const bookedSeats = useMemo(() => {
        if (!seatsData) return [];
        const allSeats = [];
        Object.values(seatsData).forEach((deckSeats) => {
            deckSeats.forEach((seat) => {
                if (seat.booking_info) {
                    allSeats.push(seat);
                }
            });
        });
        return allSeats;
    }, [seatsData]);

    // Filter booked seats based on search query
    const filteredSeats = useMemo(() => {
        if (!searchQuery.trim()) {
            return bookedSeats;
        }

        const query = searchQuery.toLowerCase().trim();
        return bookedSeats.filter((seat) => {
            const booking = seat.booking_info;
            if (!booking) return false;

            // Search in multiple fields
            const searchFields = [
                seat.label, // Seat label
                booking.passenger_name || "",
                booking.passenger_phone || "",
                booking.passenger_email || "",
                booking.booking_code || "",
                booking.pickup_address || "",
                booking.dropoff_address || "",
                booking.pickup_location_name || "",
                booking.dropoff_location_name || "",
            ];

            return searchFields.some((field) =>
                field.toLowerCase().includes(query)
            );
        });
    }, [bookedSeats, searchQuery]);

    // Notify parent of search results
    React.useEffect(() => {
        if (onSearchResultsChange) {
            onSearchResultsChange(
                searchQuery.trim() ? filteredSeats.map((s) => s.label) : []
            );
        }
    }, [filteredSeats, searchQuery, onSearchResultsChange]);

    const handleClear = () => {
        setSearchQuery("");
    };

    return (
        <div className="booking-search-panel">
            <div className="booking-search-panel__header">
                <h3 className="booking-search-panel__title">
                    Tìm kiếm đặt chỗ
                </h3>
                <p className="booking-search-panel__subtitle">
                    Tìm kiếm theo tên, số điện thoại, mã đặt chỗ, địa chỉ...
                </p>
            </div>

            <div className="booking-search-panel__search-box">
                <div className="booking-search-panel__input-wrapper">
                    <Search className="booking-search-panel__search-icon" size={20} />
                    <input
                        type="text"
                        className="booking-search-panel__input"
                        placeholder="Nhập tên, số điện thoại, mã đặt chỗ, địa chỉ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="booking-search-panel__clear-btn"
                            onClick={handleClear}
                            type="button"
                            title="Xóa tìm kiếm"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {searchQuery && (
                <div className="booking-search-panel__results">
                    <div className="booking-search-panel__results-header">
                        <span className="booking-search-panel__results-count">
                            Tìm thấy {filteredSeats.length} kết quả
                        </span>
                    </div>
                    {filteredSeats.length > 0 ? (
                        <div className="booking-search-panel__results-list">
                            {filteredSeats.map((seat) => {
                                const booking = seat.booking_info;
                                return (
                                    <div
                                        key={seat.label}
                                        className="booking-search-panel__result-item"
                                    >
                                        <div className="booking-search-panel__result-seat">
                                            Ghế {seat.label}
                                        </div>
                                        <div className="booking-search-panel__result-info">
                                            <div className="booking-search-panel__result-name">
                                                {booking.passenger_name || "N/A"}
                                            </div>
                                            <div className="booking-search-panel__result-details">
                                                <span>
                                                    📞 {booking.passenger_phone || "N/A"}
                                                </span>
                                                <span>
                                                    📧 {booking.passenger_email || "N/A"}
                                                </span>
                                                <span>
                                                    🎫 Mã: {booking.booking_code || "N/A"}
                                                </span>
                                            </div>
                                            {(booking.pickup_address ||
                                                booking.dropoff_address) && (
                                                <div className="booking-search-panel__result-address">
                                                    <span>
                                                        📍 Đón:{" "}
                                                        {booking.pickup_address ||
                                                            booking.pickup_location_name ||
                                                            "N/A"}
                                                    </span>
                                                    <span>
                                                        📍 Trả:{" "}
                                                        {booking.dropoff_address ||
                                                            booking.dropoff_location_name ||
                                                            "N/A"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="booking-search-panel__no-results">
                            Không tìm thấy kết quả nào
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookingSearchPanel;

