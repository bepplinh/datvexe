import React, { useState, useCallback, useMemo } from "react";
import { SeatSelectionContext } from "./SeatSelectionContext";

export const SeatSelectionProvider = ({ children }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);

    const addSeat = useCallback((seat) => {
        setSelectedSeats((prev) => {
            // Check if seat is already selected
            if (prev.some((s) => s.label === seat.label)) {
                return prev;
            }
            return [...prev, seat];
        });
    }, []);

    const removeSeat = useCallback((seatLabel) => {
        setSelectedSeats((prev) => prev.filter((s) => s.label !== seatLabel));
    }, []);

    const toggleSeat = useCallback((seat) => {
        setSelectedSeats((prev) => {
            const isSelected = prev.some((s) => s.label === seat.label);
            if (isSelected) {
                return prev.filter((s) => s.label !== seat.label);
            } else {
                return [...prev, seat];
            }
        });
    }, []);

    const clearSeats = useCallback(() => {
        setSelectedSeats([]);
    }, []);

    const value = useMemo(
        () => ({
            selectedSeats,
            addSeat,
            removeSeat,
            toggleSeat,
            clearSeats,
        }),
        [selectedSeats, addSeat, removeSeat, toggleSeat, clearSeats]
    );

    return (
        <SeatSelectionContext.Provider value={value}>
            {children}
        </SeatSelectionContext.Provider>
    );
};

