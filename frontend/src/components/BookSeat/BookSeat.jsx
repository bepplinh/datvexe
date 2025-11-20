import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import BusInfo from "./BusInfo/BusInfo";
import SeatMap from "./Seat/SeatMap";
import "./BookSeat.scss";
import axiosClient from "../../apis/axiosClient";
import { toast } from "react-toastify";
import { useBooking } from "../../contexts/BookingProvider";
import { useSearchTrip } from "../../contexts/SearchTripProvider";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

function BookSeat({ trip, onClose }) {
    const { getTripLeg, savePendingSelection } = useBooking();
    const { results } = useSearchTrip();
    const navigate = useNavigate();

    const hasBothWays =
        Array.isArray(results?.outbound) &&
        results.outbound.length > 0 &&
        Array.isArray(results?.return) &&
        results.return.length > 0;
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [seatsData, setSeatsData] = useState({}); // Map label -> seat data (có id)
    const [isLoading, setIsLoading] = useState(false);

    const handleSeatSelect = useCallback((seats) => {
        setSelectedSeats(seats);
    }, []);

    const handleSeatsLoaded = useCallback((seats) => {
        setSeatsData(seats);
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    };

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleConfirm = async () => {
        if (selectedSeats.length === 0 || !trip) return;

        // Map seat labels thành seat_ids
        const seatIds = selectedSeats
            .map((label) => seatsData[label]?.id)
            .filter((id) => id != null);

        if (seatIds.length === 0) {
            toast.error("Không tìm thấy thông tin ghế. Vui lòng thử lại.");
            return;
        }

        if (hasBothWays) {
            // Khứ hồi: chỉ lưu ghế tạm thời, chưa gọi API giữ chỗ
            savePendingSelection(trip, selectedSeats, seatsData);
            toast.success("Đã lưu ghế. Vui lòng tiếp tục chọn chiều còn lại.");
            onClose?.();
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                from_location_id: trip.from_location_id,
                to_location_id: trip.to_location_id,
                from_location: trip.from_location,
                to_location: trip.to_location,
                trips: [
                    {
                        trip_id: trip.trip_id,
                        seat_ids: seatIds,
                        leg: getTripLeg(trip),
                    },
                ],
            };

            const { data } = await axiosClient.post(
                "/checkout/lock-seats",
                payload
            );

            if (data.success) {
                // ✅ Lưu session_token vào cookie (hỗ trợ cả snake_case và camelCase)
                const sessionToken = data.session_token || data.sessionToken;
                if (sessionToken) {
                    Cookies.set("x_session_token", sessionToken, {
                        sameSite: "Strict",
                        expires: 30,
                    });
                }
                // Một chiều: giữ chỗ thành công thì chuyển sang checkout ngay
                toast.success("Đã giữ chỗ thành công!");
                navigate(`/checkout?draft_id=${data.draft_id}`);
                onClose?.();
            } else {
                toast.error(
                    data.message || "Không thể giữ chỗ. Vui lòng thử lại."
                );
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.errors?.seats?.[0] ||
                "Có lỗi xảy ra. Vui lòng thử lại.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!trip) return null;

    return (
        <div className="book-seat-modal" onClick={handleBackdropClick}>
            <div className="book-seat-modal__content">
                <button
                    onClick={onClose}
                    className="book-seat-modal__close"
                    aria-label="Đóng"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="book-seat-modal__body">
                    <div className="book-seat-modal__grid">
                        <BusInfo trip={trip} selectedSeats={selectedSeats} />

                        <SeatMap
                            trip={trip}
                            onSeatSelect={handleSeatSelect}
                            onSeatsLoaded={handleSeatsLoaded}
                        />
                    </div>

                    <div className="book-seat-modal__footer">
                        <button
                            className="book-seat-modal__submit-btn"
                            disabled={selectedSeats.length === 0 || isLoading}
                            onClick={handleConfirm}
                        >
                            {isLoading ? "Đang xử lý..." : "Đặt vé"}{" "}
                            {selectedSeats.length > 0 &&
                                `(${selectedSeats.length} ghế)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookSeat;
