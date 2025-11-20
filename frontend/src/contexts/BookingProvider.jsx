import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useSearchTrip } from "./SearchTripProvider";

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
    const { results, tripType } = useSearchTrip();
    const [pendingSelections, setPendingSelections] = useState({});

    const getTripLeg = useCallback(
        (trip) => {
            if (!trip || !results) return "OUT";

            if (tripType === "oneway") {
                return "OUT";
            }

            if (Array.isArray(results.outbound)) {
                const isOutbound = results.outbound.some(
                    (t) => t.trip_id === trip.trip_id
                );
                if (isOutbound) return "OUT";
            }

            if (Array.isArray(results.return)) {
                const isReturn = results.return.some(
                    (t) => t.trip_id === trip.trip_id
                );
                if (isReturn) return "RETURN";
            }

            return "OUT";
        },
        [results, tripType]
    );

    const savePendingSelection = useCallback(
        (trip, seatLabels, seatsData) => {
            if (!trip || !Array.isArray(seatLabels) || seatLabels.length === 0)
                return;

            const leg = getTripLeg(trip);
            const seats = seatLabels
                .map((label) => {
                    const seatInfo = seatsData[label];
                    if (!seatInfo?.id) return null;
                    return {
                        id: seatInfo.id,
                        label,
                        price: trip.price || 0,
                    };
                })
                .filter(Boolean);

            if (seats.length === 0) return;

            // Lưu ghế tạm thời cho leg tương ứng (OUT/RETURN)
            setPendingSelections((prev) => ({
                ...prev,
                [leg]: {
                    leg,
                    trip,
                    seats,
                },
            }));
        },
        [getTripLeg]
    );

    const clearPendingSelections = useCallback(() => {
        setPendingSelections({});
    }, []);

    useEffect(() => {
        // Mỗi lần tìm chuyến mới -> reset ghế tạm
        clearPendingSelections();
    }, [results, clearPendingSelections]);

    const value = useMemo(
        () => ({
            getTripLeg,
            pendingSelections,
            savePendingSelection,
            clearPendingSelections,
        }),
        [
            getTripLeg,
            pendingSelections,
            savePendingSelection,
            clearPendingSelections,
        ]
    );

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const ctx = useContext(BookingContext);
    if (!ctx) {
        throw new Error("useBooking must be used within BookingProvider");
    }
    return ctx;
};
