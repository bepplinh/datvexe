import React, { useState, useEffect } from "react";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { adminTripService } from "../../../../services/admin/tripService";
import { toast } from "react-toastify";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import SeatMapFloor from "./SeatMapFloor";
import "./SeatMap.scss";

const ChangeSeatModal = ({
    isOpen,
    onClose,
    bookingId,
    bookingItemId,
    currentTripId,
    currentSeatId,
    onSuccess,
}) => {
    const [seatsData, setSeatsData] = useState(null);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedSeatId, setSelectedSeatId] = useState(null);
    const [selectedSeatLabel, setSelectedSeatLabel] = useState(null);
    const [seatsMap, setSeatsMap] = useState({});
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        if (isOpen && currentTripId) {
            loadSeatData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentTripId]);

    const loadSeatData = async () => {
        if (!currentTripId) return;

        try {
            setLoading(true);
            const response = await adminTripService.getTripSeats(currentTripId);

            if (response.success) {
                const seats = response.data.seats;
                setSeatsData(seats);
                setLayout(response.data.layout);

                // Convert seats to map by seat_id for easier access
                const seatMap = {};
                Object.values(seats || {}).forEach((deckSeats) => {
                    deckSeats.forEach((seat) => {
                        seatMap[seat.seat_id] = {
                            seat_id: seat.seat_id,
                            label: seat.label,
                            status: seat.status,
                            deck: seat.deck,
                            column_group: seat.column_group,
                            index: seat.index,
                            seat_type: seat.seat_type,
                            position: seat.position,
                            booking_info: seat.booking_info,
                        };
                    });
                });
                setSeatsMap(seatMap);
            }
        } catch {
            toast.error("Không thể tải sơ đồ ghế");
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seatId, seatLabel) => {
        const seat = seatsMap[seatId];
        if (!seat) return;

        // Chỉ cho phép chọn ghế available
        if (seat.status === "available") {
            setSelectedSeatId(seatId);
            setSelectedSeatLabel(seatLabel);
        } else if (seat.status === "booked") {
            toast.warning("Ghế này đã được đặt");
        } else if (seat.status === "locked") {
            toast.warning("Ghế này đang được giữ");
        }
    };

    const handleConfirm = async () => {
        if (!selectedSeatId) {
            toast.error("Vui lòng chọn ghế mới");
            return;
        }

        if (selectedSeatId === currentSeatId) {
            toast.warning("Vui lòng chọn ghế khác với ghế hiện tại");
            return;
        }

        if (!bookingId) {
            toast.error("Không tìm thấy mã booking");
            return;
        }

        if (!bookingItemId) {
            toast.error("Không tìm thấy booking item. Vui lòng thử lại sau.");
            console.error("Missing booking_item_id:", { bookingId, bookingItemId, currentSeatId });
            return;
        }

        if (
            !window.confirm(
                `Xác nhận đổi từ ghế ${seatsMap[currentSeatId]?.label || "N/A"} sang ghế ${selectedSeatLabel}?`
            )
        ) {
            return;
        }

        setIsChanging(true);
        try {
            const response = await adminBookingService.changeSeat(
                bookingId,
                bookingItemId,
                selectedSeatId
            );

            if (response.success) {
                toast.success("Đổi ghế thành công!");
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Change seat error:", error);
            console.error("Request details:", {
                bookingId,
                bookingItemId,
                newSeatId: selectedSeatId,
                url: `/admin/bookings/${bookingId}/change-seat`
            });

            let errorMessage = "Có lỗi xảy ra khi đổi ghế";

            if (error.response) {
                // Server responded with error
                errorMessage = error.response?.data?.message || errorMessage;
                if (error.response.status === 404) {
                    errorMessage = "API endpoint không tìm thấy. Vui lòng kiểm tra lại.";
                }
            } else if (error.request) {
                // Request was made but no response
                errorMessage = "Không nhận được phản hồi từ server. Vui lòng thử lại.";
            } else {
                // Something else happened
                errorMessage = error.message || errorMessage;
            }

            toast.error(errorMessage);
        } finally {
            setIsChanging(false);
        }
    };

    // Group seats by deck
    const groupedByDeck = Object.values(seatsMap || {}).reduce((acc, seat) => {
        const deckKey = `deck_${seat.deck}`;
        if (!acc[deckKey]) acc[deckKey] = [];
        acc[deckKey].push(seat);
        return acc;
    }, {});

    if (!isOpen) return null;

    return (
        <div
            className="seat-map__booking-modal-overlay"
            onClick={onClose}
        >
            <div
                className="seat-map__booking-modal seat-map__booking-modal--large"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="seat-map__booking-modal-header">
                    <h3>Đổi ghế - Chọn ghế mới</h3>
                    <button
                        className="seat-map__booking-modal-close"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
                <div className="seat-map__booking-modal-body">
                    {loading ? (
                        <div className="seat-map__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : seatsData && layout ? (
                        <div className="seat-map__floors">
                            {Object.entries(groupedByDeck).map(
                                ([deckKey, deckSeats]) => (
                                    <SeatMapFloor
                                        key={deckKey}
                                        deckKey={deckKey}
                                        deckSeats={deckSeats}
                                        layout={layout}
                                        isSeatSelected={(label) => {
                                            const seat = Object.values(seatsMap).find(
                                                (s) => s.label === label
                                            );
                                            return seat?.seat_id === selectedSeatId;
                                        }}
                                        highlightedSeats={[]}
                                        onSeatClick={(label) => {
                                            const seat = Object.values(seatsMap).find(
                                                (s) => s.label === label
                                            );
                                            if (seat) {
                                                handleSeatClick(seat.seat_id, seat.label);
                                            }
                                        }}
                                    />
                                )
                            )}
                        </div>
                    ) : null}
                    {selectedSeatLabel && (
                        <div className="seat-map__selected-seat-info">
                            <p>
                                <strong>Ghế đã chọn:</strong> {selectedSeatLabel}
                            </p>
                        </div>
                    )}
                </div>
                <div className="seat-map__booking-modal-footer">
                    <button
                        type="button"
                        className="seat-map__booking-modal-btn seat-map__booking-modal-btn--secondary"
                        onClick={onClose}
                        disabled={isChanging}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="seat-map__booking-modal-btn seat-map__booking-modal-btn--primary"
                        onClick={handleConfirm}
                        disabled={isChanging || !selectedSeatId}
                    >
                        {isChanging ? "Đang xử lý..." : "Xác nhận đổi ghế"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeSeatModal;

