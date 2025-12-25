import React from "react";
import { X, Ticket, DollarSign } from "lucide-react";
import { useSeatSelection } from "../contexts/useSeatSelection";
import "./SelectedSeatsPanel.scss";

const SelectedSeatsPanel = ({ onBookSeats }) => {
    const { selectedSeats, removeSeat } = useSeatSelection();
    // Tính giá vé - có thể lấy từ trip hoặc dùng giá mặc định
    const getSeatPrice = (seat) => {
        // TODO: Lấy giá từ API hoặc trip data
        // Tạm thời dùng giá mặc định dựa trên seat_type
        const basePrice = 200000; // 200k VNĐ
        if (seat.seat_type === "vip") {
            return basePrice * 1.5;
        }
        if (seat.seat_type === "normal") {
            return basePrice;
        }
        return basePrice;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const totalPrice = selectedSeats.reduce((sum, seat) => {
        return sum + getSeatPrice(seat);
    }, 0);

    if (selectedSeats.length === 0) {
        return null;
    }

    return (
        <div className="selected-seats-panel">
            <div className="selected-seats-panel__header">
                <div className="selected-seats-panel__header-icon">
                    <Ticket size={20} />
                </div>
                <div>
                    <h3 className="selected-seats-panel__title">
                        Ghế đã chọn
                    </h3>
                    <p className="selected-seats-panel__subtitle">
                        {selectedSeats.length} ghế
                    </p>
                </div>
            </div>

            <div className="selected-seats-panel__body">
                <div className="selected-seats-panel__seats-list">
                    {selectedSeats.map((seat) => {
                        const price = getSeatPrice(seat);
                        return (
                            <div
                                key={seat.label}
                                className="selected-seats-panel__seat-item"
                            >
                                <div className="selected-seats-panel__seat-info">
                                    <div className="selected-seats-panel__seat-label">
                                        Ghế {seat.label}
                                    </div>
                                </div>
                                <div className="selected-seats-panel__seat-price">
                                    {formatPrice(price)}
                                </div>
                                <button
                                    className="selected-seats-panel__seat-remove"
                                    onClick={() => removeSeat(seat.label)}
                                    type="button"
                                    title="Bỏ chọn"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="selected-seats-panel__summary">
                    <div className="selected-seats-panel__summary-row">
                        <span className="selected-seats-panel__summary-label">
                            Tổng cộng:
                        </span>
                        <span className="selected-seats-panel__summary-value">
                            {formatPrice(totalPrice)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="selected-seats-panel__footer">
                <button
                    className="selected-seats-panel__book-btn"
                    onClick={onBookSeats}
                    type="button"
                >
                    <DollarSign size={18} />
                    <span>Đặt ghế</span>
                </button>
            </div>
        </div>
    );
};

export default SelectedSeatsPanel;

