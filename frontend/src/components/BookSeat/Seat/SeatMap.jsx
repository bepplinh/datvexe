import { useState, useEffect, useRef } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import seatSvgUrl from "../../../assets/seat.svg?url";
import "./SeatMap.scss";
import { useEcho } from "../../../contexts/EchoContext";
import axiosClient from "../../../apis/axiosClient";

export default function SeatMap({ trip, onSeatSelect, onSeatsLoaded }) {
    const echo = useEcho();
    const [seats, setSeats] = useState({});
    const [loading, setLoading] = useState(false);
    const onSeatSelectRef = useRef(onSeatSelect);
    const onSeatsLoadedRef = useRef(onSeatsLoaded);

    useEffect(() => {
        if (!trip?.trip_id) return;

        async function loadSeatLayout() {
            try {
                setLoading(true);
                const { data } = await axiosClient.get(
                    `/client/trips/${trip.trip_id}/seats`
                );
                if (!data.success) return;

                const seatMap = {};
                Object.values(data.data.seats || {}).forEach((deckSeats) => {
                    deckSeats.forEach((seat) => {
                        seatMap[seat.label] = {
                            id: seat.seat_id,
                            label: seat.label,
                            status: seat.status,
                            deck: seat.deck,
                            column_group: seat.column_group,
                            index: seat.index,
                        };
                    });
                });
                setSeats(seatMap);
                // ✅ Notify parent component về seats data
                onSeatsLoadedRef.current?.(seatMap);
            } catch (error) {
                console.error("Failed to load seat layout:", error);
            } finally {
                setLoading(false);
            }
        }

        loadSeatLayout();
    }, [trip?.trip_id]);

    useEffect(() => {
        onSeatSelectRef.current = onSeatSelect;
        onSeatsLoadedRef.current = onSeatsLoaded;
    }, [onSeatSelect, onSeatsLoaded]);

    const updateSeatStatus = (seatLabels = [], status) => {
        setSeats((current) => {
            const next = { ...current };
            let hasChange = false;

            seatLabels.forEach((label) => {
                const seat = next[label];
                if (seat && seat.status !== status) {
                    next[label] = { ...seat, status };
                    hasChange = true;
                }
            });

            return next;
        });
    };

    const handleSeatClick = (label) => {
        setSeats((prev) => {
            const seat = prev[label];
            if (!seat || seat.status === "booked" || seat.status === "locked")
                return prev;

            const newStatus =
                seat.status === "available" ? "selected" : "available";
            const next = { ...prev, [label]: { ...seat, status: newStatus } };

            return next;
        });
    };

    useEffect(() => {
        const selected = Object.values(seats)
            .filter((s) => s.status === "selected")
            .map((s) => s.label);
        onSeatSelectRef.current?.(selected);
    }, [seats]);

    useEffect(() => {
        if (!trip?.trip_id || !echo) {
            console.warn("SeatMap: Missing trip_id or echo", {
                trip_id: trip?.trip_id,
                echo: !!echo,
            });
            return;
        }

        const channelName = `trip.${trip.trip_id}`;
        const channel = echo.private(channelName);

        channel
            .error((error) => {
                console.error("SeatMap: Channel subscription error", error);
            })
            .listen(".SeatLocked", ({ locks }) => {
                const seatLabels = locks.flatMap(
                    (lock) => lock.seat_labels ?? []
                );
                updateSeatStatus(seatLabels, "locked");
            })
            .listen(".SeatUnlocked", (payload) => {
                const { unlocks } = payload || {};
                const currentTripId = trip?.trip_id;

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

                if (seatLabels.length === 0) {
                    return;
                }

                updateSeatStatus(seatLabels, "available");
            })
            .listen(".SeatBooked", ({ booked }) => {
                const seatLabels = booked.flatMap(
                    (item) => item.seat_labels ?? []
                );
                updateSeatStatus(seatLabels, "booked");
            });

        return () => {
            echo.leave(channelName);
        };
    }, [trip?.trip_id, echo]);

    const getSeatClassName = (status) => {
        const baseClass = "seat-map__seat";
        switch (status) {
            case "booked":
                return `${baseClass} ${baseClass}--booked`;
            case "selected":
                return `${baseClass} ${baseClass}--selected`;
            case "locked":
                return `${baseClass} ${baseClass}--locked`;
            default:
                return `${baseClass} ${baseClass}--available`;
        }
    };

    const groupedByDeck = Object.values(seats || {}).reduce((acc, seat) => {
        const deckKey = `deck_${seat.deck}`;
        if (!acc[deckKey]) acc[deckKey] = [];
        acc[deckKey].push(seat);
        return acc;
    }, {});

    const getSeatRowIndex = (seat = {}) => {
        if (typeof seat.index === "number") return seat.index;
        const numericPart = parseInt(
            (seat.label || "").replace(/^\D+/g, "") || "0",
            10
        );
        return Number.isNaN(numericPart) ? 0 : numericPart;
    };

    const getColumnPriority = (seat = {}) => {
        const columnGroup =
            (seat.column_group || seat.label || "").replace(/[0-9]/g, "") ||
            "default";
        const priorities = ["B", "C", "A", "D", "default"];
        const index = priorities.indexOf(columnGroup);
        return index === -1 ? priorities.length : index;
    };

    const groupSeatsByDeck = (deckSeats = []) => {
        const rows = deckSeats.reduce((acc, seat) => {
            const rowKey = getSeatRowIndex(seat);
            if (!acc[rowKey]) acc[rowKey] = [];
            acc[rowKey].push(seat);
            return acc;
        }, {});

        return Object.entries(rows)
            .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
            .map(([, rowSeats]) =>
                rowSeats.sort((a, b) => {
                    const priorityDiff =
                        getColumnPriority(a) - getColumnPriority(b);
                    if (priorityDiff !== 0) return priorityDiff;
                    return (a.label || "").localeCompare(b.label || "");
                })
            );
    };

    const busName = trip?.bus?.name || "NHÀ XE";

    if (loading) {
        return (
            <div className="seat-map seat-map--loading">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="seat-map">
            <div className="seat-map__header">
                <h3 className="seat-map__title">{busName}</h3>

                {/* Chú thích màu sắc */}
                <div className="seat-map__legend">
                    <div className="seat-map__legend-item">
                        <div className="seat-map__legend-icon seat-map__legend-icon--available"></div>
                        <span className="seat-map__legend-text">Ghế trống</span>
                    </div>
                    <div className="seat-map__legend-item">
                        <div className="seat-map__legend-icon seat-map__legend-icon--locked"></div>
                        <span className="seat-map__legend-text">
                            Đang giữ chỗ
                        </span>
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

            <div className="seat-map__floors">
                {Object.entries(groupedByDeck).map(([deckKey, deckSeats]) => (
                    <div className="seat-map__floor" key={deckKey}>
                        <h4 className="seat-map__floor-title">
                            Tầng{" "}
                            {Number(deckKey.replace("deck_", "")) || deckKey}
                        </h4>
                        <div className="seat-map__floor-seats">
                            {groupSeatsByDeck(deckSeats).map((row, rowIdx) => (
                                <div key={rowIdx} className="seat-map__row">
                                    {row.map((seat) => (
                                        <div
                                            key={seat.label}
                                            className="seat-map__seat-wrapper"
                                        >
                                            <button
                                                onClick={() =>
                                                    handleSeatClick(seat.label)
                                                }
                                                className={getSeatClassName(
                                                    seat.status
                                                )}
                                                disabled={
                                                    seat.status === "booked" ||
                                                    seat.status === "locked"
                                                }
                                                aria-label={`Ghế ${seat.label}`}
                                            >
                                                <img
                                                    src={seatSvgUrl}
                                                    alt="Ghế"
                                                    className="seat-map__seat-icon"
                                                />
                                            </button>
                                            <span className="seat-map__seat-label">
                                                {seat.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
