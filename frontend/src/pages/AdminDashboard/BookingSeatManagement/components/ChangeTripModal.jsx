import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { fetchRoutes } from "../../../../store/slices/routeSlice";
import { fetchTrips } from "../../../../store/slices/tripSlice";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { adminTripService } from "../../../../services/admin/tripService";
import { toast } from "react-toastify";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import FilterPanel from "./FilterPanel";
import TripList from "./TripList";
import SeatMapFloor from "./SeatMapFloor";
import "./SeatMap.scss";
import "./ChangeTripModal.scss";

const ChangeTripModal = ({
    isOpen,
    onClose,
    bookingId,
    bookingItemId,
    currentTrip,
    currentSeatId,
    onSuccess,
}) => {
    const dispatch = useAppDispatch();
    const { routes, loading: routesLoading } = useAppSelector(
        (state) => state.route
    );
    const { trips, loading: tripsLoading } = useAppSelector(
        (state) => state.trip
    );

    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [selectedSeatId, setSelectedSeatId] = useState(null);
    const [selectedSeatLabel, setSelectedSeatLabel] = useState(null);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchRoutes());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (selectedRouteId && selectedDate) {
            const params = {
                route_id: selectedRouteId,
                date_from: selectedDate,
                date_to: selectedDate,
                per_page: 1000,
            };
            dispatch(fetchTrips(params));
        } else {
            setFilteredTrips([]);
        }
    }, [selectedRouteId, selectedDate, dispatch]);

    useEffect(() => {
        if (trips && Array.isArray(trips)) {
            const filtered = trips.filter((trip) => {
                if (!trip.departure_time) return false;
                const tripDate = new Date(trip.departure_time)
                    .toISOString()
                    .split("T")[0];
                return tripDate === selectedDate;
            });
            setFilteredTrips(filtered);
        } else {
            setFilteredTrips([]);
        }
    }, [trips, selectedDate]);

    const handleRouteChange = (e) => {
        setSelectedRouteId(e.target.value);
        setSelectedTrip(null);
        setSelectedSeatId(null);
        setSelectedSeatLabel(null);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
        setSelectedTrip(null);
        setSelectedSeatId(null);
        setSelectedSeatLabel(null);
    };

    const handleTripClick = (trip) => {
        // Không cho chọn chuyến hiện tại
        if (trip.id === currentTrip?.id) {
            toast.warning("Vui lòng chọn chuyến khác với chuyến hiện tại");
            return;
        }
        setSelectedTrip(trip);
        setSelectedSeatId(null);
        setSelectedSeatLabel(null);
    };

    const handleSeatSelect = (seatLabel, seatId) => {
        setSelectedSeatId(seatId);
        setSelectedSeatLabel(seatLabel);
    };

    const handleConfirm = async () => {
        if (!selectedTrip) {
            toast.error("Vui lòng chọn chuyến mới");
            return;
        }

        if (!selectedSeatId) {
            toast.error("Vui lòng chọn ghế mới");
            return;
        }

        if (
            !window.confirm(
                `Xác nhận đổi từ chuyến ${currentTrip?.id || "N/A"} sang chuyến ${selectedTrip.id}?\n` +
                `Ghế: ${selectedSeatLabel || "N/A"}`
            )
        ) {
            return;
        }

        setIsChanging(true);
        try {
            const response = await adminBookingService.changeTrip(
                bookingId,
                bookingItemId,
                selectedTrip.id,
                {
                    newSeatId: selectedSeatId,
                }
            );

            if (response.success) {
                let message = "Đổi chuyến thành công!";
                
                if (response.requires_payment) {
                    const difference = Math.abs(response.price_difference || 0);
                    message = `Đổi chuyến thành công! Khách cần thanh toán thêm ${difference.toLocaleString("vi-VN")} VNĐ. Vui lòng xác nhận thanh toán sau khi khách đã trả.`;
                    toast.success(message, { autoClose: 6000 });
                } else if (response.requires_refund) {
                    const difference = Math.abs(response.price_difference || 0);
                    message = `Đổi chuyến thành công! Đã tự động ghi nhận hoàn tiền ${difference.toLocaleString("vi-VN")} VNĐ. Vui lòng thực hiện hoàn tiền cho khách.`;
                    toast.success(message, { autoClose: 6000 });
                } else {
                    toast.success(message);
                }
                
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Change trip error:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Có lỗi xảy ra khi đổi chuyến";
            toast.error(errorMessage);
        } finally {
            setIsChanging(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="seat-map__booking-modal-overlay"
            onClick={onClose}
        >
            <div
                className="seat-map__booking-modal seat-map__booking-modal--large seat-map__booking-modal--change-trip"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="seat-map__booking-modal-header">
                    <h3>Đổi chuyến - Chọn chuyến và ghế mới</h3>
                    <button
                        className="seat-map__booking-modal-close"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
                <div className="seat-map__booking-modal-body seat-map__booking-modal-body--change-trip">
                    <div className="change-trip-modal__top-section">
                        <div className="change-trip-modal__filters">
                            <FilterPanel
                                routes={routes}
                                routesLoading={routesLoading}
                                selectedRouteId={selectedRouteId}
                                selectedDate={selectedDate}
                                onRouteChange={handleRouteChange}
                                onDateChange={handleDateChange}
                            />
                        </div>

                        <div className="change-trip-modal__trip-list">
                            <TripList
                                trips={filteredTrips}
                                loading={tripsLoading}
                                selectedRouteId={selectedRouteId}
                                selectedDate={selectedDate}
                                onTripClick={handleTripClick}
                                selectedTripId={selectedTrip?.id}
                            />
                        </div>
                    </div>

                    <div className="change-trip-modal__content">

                        {selectedTrip && (
                            <div className="change-trip-modal__seat-map">
                                <div className="change-trip-modal__seat-map-header">
                                    <h4>Chọn ghế cho chuyến mới</h4>
                                    <p>
                                        Chuyến: {selectedTrip.id} -{" "}
                                        {new Date(
                                            selectedTrip.departure_time
                                        ).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                                <SeatMapSelector
                                    trip={selectedTrip}
                                    onSeatSelect={handleSeatSelect}
                                    selectedSeatId={selectedSeatId}
                                />
                            </div>
                        )}
                    </div>

                    {selectedSeatLabel && (
                        <div className="seat-map__selected-seat-info">
                            <p>
                                <strong>Chuyến đã chọn:</strong> {selectedTrip?.id}
                                <br />
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
                        disabled={
                            isChanging ||
                            !selectedTrip ||
                            !selectedSeatId
                        }
                    >
                        {isChanging ? "Đang xử lý..." : "Xác nhận đổi chuyến"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component nhỏ để hiển thị seat map và cho phép chọn ghế
const SeatMapSelector = ({ trip, onSeatSelect, selectedSeatId }) => {
    const [seatsData, setSeatsData] = useState(null);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [seatsMap, setSeatsMap] = useState({});

    useEffect(() => {
        if (trip?.id) {
            loadSeatData();
        }
    }, [trip?.id]);

    const loadSeatData = async () => {
        if (!trip?.id) return;

        try {
            setLoading(true);
            const response = await adminTripService.getTripSeats(trip.id);

            if (response.success) {
                const seats = response.data.seats;
                setSeatsData(seats);
                setLayout(response.data.layout);

                const seatMap = {};
                Object.values(seats || {}).forEach((deckSeats) => {
                    deckSeats.forEach((seat) => {
                        seatMap[seat.label] = {
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

    const handleSeatClick = (label) => {
        const seat = seatsMap[label];
        if (!seat) return;

        if (seat.status === "available") {
            onSeatSelect(label, seat.seat_id);
        } else if (seat.status === "booked") {
            toast.warning("Ghế này đã được đặt");
        } else if (seat.status === "locked") {
            toast.warning("Ghế này đang được giữ");
        }
    };

    const isSeatSelected = (label) => {
        const seat = seatsMap[label];
        return seat?.seat_id === selectedSeatId;
    };

    const groupedByDeck = Object.values(seatsMap || {}).reduce((acc, seat) => {
        const deckKey = `deck_${seat.deck}`;
        if (!acc[deckKey]) acc[deckKey] = [];
        acc[deckKey].push(seat);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="seat-map__loading">
                <CircularIndeterminate />
            </div>
        );
    }

    if (!seatsData || !layout) {
        return <div className="seat-map__error">Không có sơ đồ ghế</div>;
    }

    return (
        <div className="seat-map seat-map--compact">
            <div className="seat-map__floors">
                {Object.entries(groupedByDeck).map(([deckKey, deckSeats]) => (
                    <SeatMapFloor
                        key={deckKey}
                        deckKey={deckKey}
                        deckSeats={deckSeats}
                        layout={layout}
                        isSeatSelected={isSeatSelected}
                        highlightedSeats={[]}
                        onSeatClick={handleSeatClick}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChangeTripModal;

