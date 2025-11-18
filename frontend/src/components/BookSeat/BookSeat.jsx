import { useState, useEffect } from "react";
import { X } from "lucide-react";
import BusInfo from "./BusInfo/BusInfo";
import SeatMap from "./Seat/SeatMap";
import "./BookSeat.scss";

function BookSeat({ trip, onClose }) {
    const [selectedSeats, setSelectedSeats] = useState([]);

    const handleSeatSelect = (seats) => {
        setSelectedSeats(seats);
    };

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

                        <SeatMap trip={trip} onSeatSelect={handleSeatSelect} />
                    </div>

                    <div className="book-seat-modal__footer">
                        <button
                            className="book-seat-modal__submit-btn"
                            disabled={selectedSeats.length === 0}
                            onClick={() => {
                                console.log("Booking seats:", selectedSeats);
                            }}
                        >
                            Đặt vé{" "}
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
