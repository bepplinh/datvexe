import React, { useEffect, useState } from "react";
import { adminTripService } from "../../../../services/admin/tripService";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import { useEcho } from "../../../../contexts/EchoContext";
import { useSeatSelection } from "../contexts/useSeatSelection";
import SeatMapHeader from "./SeatMapHeader";
import SeatMapFloor from "./SeatMapFloor";
import BookingInfoModal from "./BookingInfoModal";
import "./SeatMap.scss";

const SeatMap = ({ trip, onClose, onSeatsDataChange, highlightedSeats = [], reloadTrigger }) => {
    const echo = useEcho();
    const { selectedSeats, toggleSeat, clearSeats } = useSeatSelection();
    const [seatsData, setSeatsData] = useState(null);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [seatsMap, setSeatsMap] = useState({});
    const [selectedBookingSeat, setSelectedBookingSeat] = useState(null);

    // Notify parent when seatsData changes
    useEffect(() => {
        if (onSeatsDataChange) {
            onSeatsDataChange(seatsData);
        }
    }, [seatsData, onSeatsDataChange]);

    // Clear selected seats when trip changes or component unmounts
    useEffect(() => {
        // Clear seats when trip changes
        if (trip?.id) {
            clearSeats();
        }
        // Cleanup: clear seats on unmount
        return () => {
            clearSeats();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trip?.id]);

    const loadSeatData = async () => {
        if (!trip?.id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await adminTripService.getTripSeats(trip.id);

            if (response.success) {
                const seats = response.data.seats;
                setSeatsData(seats);
                setLayout(response.data.layout);

                // Convert seats to map by label for easier access
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
            } else {
                setError(response.message || "Không thể tải sơ đồ ghế");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Có lỗi xảy ra khi tải sơ đồ ghế"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSeatData();
    }, [trip, reloadTrigger]);

    const updateSeatStatus = (seatLabels = [], status) => {
        setSeatsMap((current) => {
            const next = { ...current };

            seatLabels.forEach((label) => {
                const seat = next[label];
                if (seat && seat.status !== status) {
                    next[label] = { ...seat, status };
                }
            });

            return next;
        });

        // Cập nhật seatsData để đồng bộ
        setSeatsData((current) => {
            if (!current) return current;
            const updated = { ...current };
            Object.keys(updated).forEach((deck) => {
                updated[deck] = updated[deck].map((seat) => {
                    if (seatLabels.includes(seat.label)) {
                        return { ...seat, status };
                    }
                    return seat;
                });
            });
            return updated;
        });
    };

    // Realtime updates
    useEffect(() => {
        if (!trip?.id || !echo) {
            return;
        }

        const channelName = `trip.${trip.id}`;
        const channel = echo.private(channelName);

        channel.subscribed(() => {
            // Channel subscribed
        });

        channel
            .error((error) => {
                console.error("SeatMap: Channel subscription error", error);
            })
            .listen(".SeatLocked", (payload) => {
                const { locks } = payload || {};
                if (!locks || !Array.isArray(locks)) {
                    return;
                }

                const seatLabels = locks.flatMap(
                    (lock) => lock.seat_labels ?? []
                );

                if (seatLabels.length > 0) {
                    updateSeatStatus(seatLabels, "locked");
                }
            })
            .listen(".SeatUnlocked", (payload) => {
                const { unlocks } = payload || {};
                const currentTripId = trip?.id;

                if (!currentTripId || !unlocks || !Array.isArray(unlocks)) {
                    return;
                }

                const tripUnlock = unlocks.find(
                    (u) => parseInt(u.trip_id) === parseInt(currentTripId)
                );

                if (!tripUnlock || !tripUnlock.seat_labels) {
                    return;
                }

                const seatLabels = Array.isArray(tripUnlock.seat_labels)
                    ? tripUnlock.seat_labels
                    : [tripUnlock.seat_labels];

                if (seatLabels.length > 0) {
                    updateSeatStatus(seatLabels, "available");
                }
            })
            .listen(".SeatBooked", async (payload) => {
                const { booked } = payload || {};
                if (!booked || !Array.isArray(booked)) {
                    return;
                }

                const seatLabels = booked.flatMap(
                    (item) => item.seat_labels ?? []
                );

                if (seatLabels.length > 0) {
                    // Reload seat data để lấy thông tin booking mới
                    try {
                        const response = await adminTripService.getTripSeats(trip.id);
                        if (response.success) {
                            const seats = response.data.seats;
                            setSeatsData(seats);

                            // Update seatsMap với booking info mới
                            setSeatsMap((current) => {
                                const next = { ...current };
                                Object.values(seats || {}).forEach((deckSeats) => {
                                    deckSeats.forEach((seat) => {
                                        if (seatLabels.includes(seat.label)) {
                                            next[seat.label] = {
                                                ...(next[seat.label] || {}),
                                                ...seat,
                                                status: "booked",
                                                booking_info: seat.booking_info,
                                            };
                                        }
                                    });
                                });
                                return next;
                            });
                        }
                    } catch (err) {
                        console.error("Failed to reload seat data:", err);
                        // Fallback: chỉ update status
                        updateSeatStatus(seatLabels, "booked");
                    }
                }
            });

        return () => {
            echo.leave(channelName);
        };
    }, [trip?.id, echo]);

    const handleSeatClick = (label) => {
        const seat = seatsMap[label];
        if (!seat) return;

        // Nếu ghế đã đặt, hiển thị thông tin booking
        if (seat.status === "booked" && seat.booking_info) {
            setSelectedBookingSeat(seat);
            return;
        }

        // Nếu ghế đang giữ, không cho chọn
        if (seat.status === "locked") {
            return;
        }

        // Chọn/bỏ chọn ghế trống sử dụng context
        toggleSeat(seat);
    };

    const isSeatSelected = (label) => {
        return selectedSeats.some((s) => s.label === label);
    };

    // Group seats by deck
    const groupedByDeck = Object.values(seatsMap || {}).reduce((acc, seat) => {
        const deckKey = `deck_${seat.deck}`;
        if (!acc[deckKey]) acc[deckKey] = [];
        acc[deckKey].push(seat);
        return acc;
    }, {});

    if (!trip) {
        return null;
    }

    return (
        <div className="seat-map">
            <SeatMapHeader trip={trip} onClose={onClose} />

            <div className="seat-map__content">
                {loading ? (
                    <div className="seat-map__loading">
                        <CircularIndeterminate />
                    </div>
                ) : error ? (
                    <div className="seat-map__error">
                        <p>{error}</p>
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
                                    isSeatSelected={isSeatSelected}
                                    highlightedSeats={highlightedSeats}
                                    onSeatClick={handleSeatClick}
                                />
                            )
                        )}
                    </div>
                ) : null}
            </div>

            <BookingInfoModal
                seat={selectedBookingSeat}
                onClose={() => setSelectedBookingSeat(null)}
                onBookingUpdated={loadSeatData}
                trip={trip}
            />
        </div>
    );
};

export default SeatMap;
