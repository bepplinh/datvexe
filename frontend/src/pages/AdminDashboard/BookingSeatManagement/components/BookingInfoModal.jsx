import React, { useEffect, useState } from "react";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { toast } from "react-toastify";
import ChangeSeatModal from "./ChangeSeatModal";
import ChangeTripModal from "./ChangeTripModal";
import RefundModal from "./RefundModal";
import RefundPriceDifferenceModal from "./RefundPriceDifferenceModal";
import "./SeatMap.scss";

const BookingInfoModal = ({ seat, onClose, onBookingUpdated, trip }) => {
    const bookingInfo = seat?.booking_info;
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [isMarkingAdditionalPaid, setIsMarkingAdditionalPaid] = useState(false);
    const [isChangeSeatModalOpen, setIsChangeSeatModalOpen] = useState(false);
    const [isChangeTripModalOpen, setIsChangeTripModalOpen] = useState(false);
    const [isRefundPriceDifferenceModalOpen, setIsRefundPriceDifferenceModalOpen] = useState(false);
    const [isRefundFullBookingModalOpen, setIsRefundFullBookingModalOpen] = useState(false);
    const [refundPolicy, setRefundPolicy] = useState(null);

    useEffect(() => {
        if (seat) {
            console.log(seat);
        }
    }, [seat]);

    useEffect(() => {
        // Load refund policy để check có pending refund không
        if (bookingInfo?.booking_id && bookingInfo?.status === "paid") {
            loadRefundPolicy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingInfo?.booking_id, bookingInfo?.status]);

    const loadRefundPolicy = async () => {
        if (!bookingInfo?.booking_id) return;

        try {
            const response = await adminBookingService.getRefundPolicy(
                bookingInfo.booking_id
            );
            if (response.success && response.data) {
                setRefundPolicy(response.data);
            }
        } catch (error) {
            console.error("Error loading refund policy:", error);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!bookingInfo?.booking_id) {
            toast.error("Không tìm thấy mã booking");
            return;
        }

        if (!window.confirm("Xác nhận đánh dấu đơn này đã thanh toán?")) {
            return;
        }

        setIsMarkingPaid(true);
        try {
            const response = await adminBookingService.markAsPaid(
                bookingInfo.booking_id
            );

            if (response.success) {
                toast.success("Đã đánh dấu đơn thanh toán thành công!");
                if (onBookingUpdated) {
                    onBookingUpdated();
                }
                onClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Có lỗi xảy ra khi đánh dấu đã thanh toán";
            toast.error(errorMessage);
        } finally {
            setIsMarkingPaid(false);
        }
    };

    const handleMarkAdditionalPaymentPaid = async () => {
        if (!bookingInfo?.booking_id) {
            toast.error("Không tìm thấy mã booking");
            return;
        }

        if (!window.confirm("Xác nhận khách đã thanh toán phần chênh lệch giá?")) {
            return;
        }

        setIsMarkingAdditionalPaid(true);
        try {
            const response = await adminBookingService.markAdditionalPaymentPaid(
                bookingInfo.booking_id
            );

            if (response.success) {
                toast.success("Đã xác nhận thanh toán bổ sung thành công!");
                if (onBookingUpdated) {
                    onBookingUpdated();
                }
                onClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Có lỗi xảy ra khi xác nhận thanh toán bổ sung";
            toast.error(errorMessage);
        } finally {
            setIsMarkingAdditionalPaid(false);
        }
    };

    if (!seat || !seat.booking_info) return null;

    return (
        <div
            className="seat-map__booking-modal-overlay"
            onClick={onClose}
        >
            <div
                className="seat-map__booking-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="seat-map__booking-modal-header">
                    <h3>Thông tin đặt chỗ - Ghế {seat.label}</h3>
                    <button
                        className="seat-map__booking-modal-close"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
                <div className="seat-map__booking-modal-body">
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Mã vé:
                        </span>
                        <span className="seat-map__booking-info-value">
                            {bookingInfo.booking_code || "N/A"}
                        </span>
                    </div>
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Tên khách hàng:
                        </span>
                        <span className="seat-map__booking-info-value">
                            {bookingInfo.passenger_name}
                        </span>
                    </div>
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Số điện thoại:
                        </span>
                        <span className="seat-map__booking-info-value">
                            {bookingInfo.passenger_phone || "N/A"}
                        </span>
                    </div>
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Email:
                        </span>
                        <span className="seat-map__booking-info-value">
                            {bookingInfo.passenger_email || "N/A"}
                        </span>
                    </div>
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Tuyến đường:
                        </span>
                        <span className="seat-map__booking-info-value seat-map__booking-info-route">
                            <span className="seat-map__booking-route-pickup">
                                {bookingInfo.pickup_address ||
                                    bookingInfo.pickup_location_name ||
                                    "N/A"}
                            </span>
                            <span className="seat-map__booking-route-arrow">→</span>
                            <span className="seat-map__booking-route-dropoff">
                                {bookingInfo.dropoff_address ||
                                    bookingInfo.dropoff_location_name ||
                                    "N/A"}
                            </span>
                        </span>
                    </div>
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Thời gian đặt:
                        </span>
                        <span className="seat-map__booking-info-value">
                            {bookingInfo.created_at
                                ? new Date(bookingInfo.created_at).toLocaleString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                                : bookingInfo.booking_date || "N/A"}
                        </span>
                    </div>
                    <div className="seat-map__booking-info-item">
                        <span className="seat-map__booking-info-label">
                            Trạng thái:
                        </span>
                        <span className="seat-map__booking-info-value">
                            {bookingInfo.status === "paid" ? (
                                <span className="seat-map__booking-status-badge seat-map__booking-status-badge--paid">
                                    Đã thanh toán
                                </span>
                            ) : bookingInfo.status === "pending" ? (
                                <span className="seat-map__booking-status-badge seat-map__booking-status-badge--pending">
                                    Chờ thanh toán
                                </span>
                            ) : (
                                bookingInfo.status || "N/A"
                            )}
                        </span>
                    </div>
                </div>
                <div className="seat-map__booking-modal-footer">
                    <div className="seat-map__booking-modal-actions">
                        {bookingInfo.status === "pending" && (
                            <button
                                type="button"
                                className="seat-map__booking-mark-paid-btn"
                                onClick={handleMarkAsPaid}
                                disabled={isMarkingPaid}
                            >
                                {isMarkingPaid
                                    ? "Đang xử lý..."
                                    : "Xác nhận đã thanh toán"}
                            </button>
                        )}
                        {bookingInfo.status === "paid" && (
                            <>
                                {bookingInfo.has_pending_additional_payment && (
                                    <button
                                        type="button"
                                        className="seat-map__booking-mark-paid-btn"
                                        onClick={handleMarkAdditionalPaymentPaid}
                                        disabled={isMarkingAdditionalPaid}
                                    >
                                        {isMarkingAdditionalPaid
                                            ? "Đang xử lý..."
                                            : "Xác nhận thanh toán bổ sung"}
                                    </button>
                                )}
                                {refundPolicy?.pending_refund_from_modification > 0 && (
                                    <button
                                        type="button"
                                        className="seat-map__booking-modify-btn seat-map__booking-modify-btn--refund-difference"
                                        onClick={() => {
                                            if (!bookingInfo?.booking_id) {
                                                toast.error("Không tìm thấy thông tin booking. Vui lòng thử lại sau.");
                                                return;
                                            }
                                            setIsRefundPriceDifferenceModalOpen(true);
                                        }}
                                        disabled={isMarkingPaid || isMarkingAdditionalPaid}
                                        style={{ background: "#ed8936", marginRight: "0.5rem" }}
                                    >
                                        Hoàn tiền chênh lệch
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="seat-map__booking-modify-btn seat-map__booking-modify-btn--refund"
                                    onClick={() => {
                                        if (!bookingInfo?.booking_id) {
                                            toast.error("Không tìm thấy thông tin booking. Vui lòng thử lại sau.");
                                            return;
                                        }
                                        setIsRefundFullBookingModalOpen(true);
                                    }}
                                    disabled={isMarkingPaid || isMarkingAdditionalPaid}
                                >
                                    Hoàn tiền cả vé
                                </button>
                            </>
                        )}
                        <div className="seat-map__booking-modify-actions">
                            <button
                                type="button"
                                className="seat-map__booking-modify-btn seat-map__booking-modify-btn--change-seat"
                                onClick={() => {
                                    if (!bookingInfo?.booking_item_id) {
                                        toast.error("Không tìm thấy thông tin booking item. Vui lòng thử lại sau.");
                                        console.error("Missing booking_item_id in bookingInfo:", bookingInfo);
                                        return;
                                    }
                                    setIsChangeSeatModalOpen(true);
                                }}
                                disabled={isMarkingPaid || !bookingInfo?.booking_item_id}
                            >
                                Đổi ghế
                            </button>
                            <button
                                type="button"
                                className="seat-map__booking-modify-btn seat-map__booking-modify-btn--change-trip"
                                onClick={() => {
                                    if (!bookingInfo?.booking_item_id) {
                                        toast.error("Không tìm thấy thông tin booking item. Vui lòng thử lại sau.");
                                        console.error("Missing booking_item_id in bookingInfo:", bookingInfo);
                                        return;
                                    }
                                    setIsChangeTripModalOpen(true);
                                }}
                                disabled={isMarkingPaid || !bookingInfo?.booking_item_id}
                            >
                                Đổi chuyến
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isChangeSeatModalOpen && bookingInfo?.booking_id && bookingInfo?.booking_item_id && (
                <ChangeSeatModal
                    isOpen={isChangeSeatModalOpen}
                    onClose={() => setIsChangeSeatModalOpen(false)}
                    bookingId={bookingInfo.booking_id}
                    bookingItemId={bookingInfo.booking_item_id}
                    currentTripId={trip?.id}
                    currentSeatId={seat?.seat_id}
                    onSuccess={() => {
                        if (onBookingUpdated) {
                            onBookingUpdated();
                        }
                    }}
                />
            )}

            {isChangeTripModalOpen && bookingInfo?.booking_id && bookingInfo?.booking_item_id && (
                <ChangeTripModal
                    isOpen={isChangeTripModalOpen}
                    onClose={() => setIsChangeTripModalOpen(false)}
                    bookingId={bookingInfo.booking_id}
                    bookingItemId={bookingInfo.booking_item_id}
                    currentTrip={trip}
                    currentSeatId={seat?.seat_id}
                    onSuccess={() => {
                        if (onBookingUpdated) {
                            onBookingUpdated();
                        }
                    }}
                />
            )}

            {isRefundPriceDifferenceModalOpen && bookingInfo?.booking_id && (
                <RefundPriceDifferenceModal
                    isOpen={isRefundPriceDifferenceModalOpen}
                    onClose={() => setIsRefundPriceDifferenceModalOpen(false)}
                    bookingId={bookingInfo.booking_id}
                    bookingCode={bookingInfo.booking_code}
                    onSuccess={() => {
                        if (onBookingUpdated) {
                            onBookingUpdated();
                        }
                        setRefundPolicy(null);
                        loadRefundPolicy();
                    }}
                />
            )}

            {isRefundFullBookingModalOpen && bookingInfo?.booking_id && (
                <RefundModal
                    isOpen={isRefundFullBookingModalOpen}
                    onClose={() => setIsRefundFullBookingModalOpen(false)}
                    bookingId={bookingInfo.booking_id}
                    bookingCode={bookingInfo.booking_code}
                    onSuccess={() => {
                        if (onBookingUpdated) {
                            onBookingUpdated();
                        }
                        setRefundPolicy(null);
                        onClose();
                    }}
                />
            )}
        </div>
    );
};

export default BookingInfoModal;

