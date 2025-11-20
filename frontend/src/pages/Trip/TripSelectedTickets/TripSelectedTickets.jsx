import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useBooking } from "../../../contexts/BookingProvider";
import { useSearchTrip } from "../../../contexts/SearchTripProvider";
import axiosClient from "../../../apis/axiosClient";
import "./TripSelectedTickets.scss";

const LEG_LABEL = {
    OUT: "Chiều đi",
    RETURN: "Chiều về",
};

const formatCurrency = (value = 0) =>
    `${new Intl.NumberFormat("vi-VN").format(value)} đ`;

const formatDate = (dateString) => {
    if (!dateString) return "--/--/----";
    return dayjs(dateString).format("DD/MM/YYYY");
};

function TicketLeg({ legKey, selection }) {
    if (!selection?.trip || !selection.seats?.length) {
        return (
            <div className="ticket-leg ticket-leg--empty">
                <div className="ticket-leg__title">{LEG_LABEL[legKey]}</div>
                <p className="ticket-leg__empty-text">
                    Vui lòng chọn ghế cho {LEG_LABEL[legKey].toLowerCase()}.
                </p>
            </div>
        );
    }

    const { trip, seats } = selection;
    const seatNames = seats.map((seat) => seat.label).join(", ");
    const legTotal = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

    return (
        <div className="ticket-leg">
            <div className="ticket-leg__header">
                <div>
                    <p className="ticket-leg__title">{LEG_LABEL[legKey]}</p>
                    <p className="ticket-leg__date">{formatDate(trip.day)}</p>
                </div>
                <p className="ticket-leg__time">
                    {trip.departure_time || "--:--"}
                </p>
            </div>

            <div className="ticket-leg__route">
                {trip.from_location} - {trip.to_location}
            </div>

            <div className="ticket-leg__details">
                <div className="ticket-leg__row">
                    <span>Khởi hành</span>
                    <span>{trip.departure_time || "--:--"}</span>
                </div>
                <div className="ticket-leg__row">
                    <span>Biển số xe</span>
                    <span>{trip.bus?.plate_number || "Đang cập nhật"}</span>
                </div>
                <div className="ticket-leg__row">
                    <span>Số ghế/giường</span>
                    <span className="ticket-leg__seats">{seatNames}</span>
                </div>
            </div>

            <div className="ticket-leg__prices">
                {seats.map((seat) => (
                    <div
                        className="ticket-leg__row"
                        key={`${legKey}-${seat.label}`}
                    >
                        <span>{seat.label}:</span>
                        <span className="ticket-leg__price">
                            {formatCurrency(seat.price)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="ticket-leg__subtotal">
                <span>Giá vé {LEG_LABEL[legKey].toLowerCase()}</span>
                <strong>{formatCurrency(legTotal)}</strong>
            </div>
        </div>
    );
}

export default function TripSelectedTickets() {
    const { pendingSelections, clearPendingSelections } = useBooking();
    const { results } = useSearchTrip();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const hasRoundTrip =
        Array.isArray(results?.outbound) &&
        results.outbound.length > 0 &&
        Array.isArray(results?.return) &&
        results.return.length > 0;

    const outboundSelection = pendingSelections.OUT;
    const returnSelection = pendingSelections.RETURN;

    // Tính tổng tiền cho từng leg từ danh sách ghế đã lưu
    const outboundTotal = useMemo(() => {
        return (
            outboundSelection?.seats?.reduce(
                (sum, seat) => sum + (seat.price || 0),
                0
            ) || 0
        );
    }, [outboundSelection]);

    const returnTotal = useMemo(() => {
        return (
            returnSelection?.seats?.reduce(
                (sum, seat) => sum + (seat.price || 0),
                0
            ) || 0
        );
    }, [returnSelection]);

    const grandTotal = outboundTotal + returnTotal;

    const canCheckout =
        hasRoundTrip &&
        Boolean(
            outboundSelection?.seats?.length && returnSelection?.seats?.length
        );

    if (!hasRoundTrip) {
        return null;
    }

    const handleCheckout = async () => {
        if (!canCheckout || isProcessing) return;
        // Gom payload gồm cả hai chiều để gửi 1 lần lên API lock seats
        const tripsPayload = [outboundSelection, returnSelection].map(
            (selection) => ({
                trip_id: selection.trip.trip_id,
                seat_ids: selection.seats.map((seat) => seat.id),
                leg: selection.leg,
            })
        );

        const referenceSelection = outboundSelection || returnSelection;
        if (!referenceSelection) return;

        const payload = {
            from_location_id: referenceSelection.trip.from_location_id,
            to_location_id: referenceSelection.trip.to_location_id,
            from_location: referenceSelection.trip.from_location,
            to_location: referenceSelection.trip.to_location,
            trips: tripsPayload,
        };

        setIsProcessing(true);
        try {
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
                // Lock thành công -> xoá ghế tạm và chuyển sang checkout
                toast.success("Đã giữ chỗ thành công!");
                clearPendingSelections();
                navigate(`/checkout?draft_id=${data.draft_id}`);
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
            setIsProcessing(false);
        }
    };

    return (
        <div className="trip-selected-tickets">
            <div className="trip-selected-tickets__header">
                <div>
                    <p className="trip-selected-tickets__title">Vé của bạn</p>
                    <p className="trip-selected-tickets__subtitle">
                        {canCheckout ? "(Khứ hồi)" : "(Đang chờ đủ 2 chiều)"}
                    </p>
                </div>
            </div>

            <div className="trip-selected-tickets__legs">
                <TicketLeg legKey="OUT" selection={outboundSelection} />
                <TicketLeg legKey="RETURN" selection={returnSelection} />
            </div>

            <div className="trip-selected-tickets__summary">
                <div className="trip-selected-tickets__row">
                    <span>Giá vé chiều đi</span>
                    <span>{formatCurrency(outboundTotal)}</span>
                </div>
                <div className="trip-selected-tickets__row">
                    <span>Giá vé chiều về</span>
                    <span>{formatCurrency(returnTotal)}</span>
                </div>
                <div className="trip-selected-tickets__row trip-selected-tickets__row--strong">
                    <span>Tổng tiền</span>
                    <span>{formatCurrency(grandTotal)}</span>
                </div>
            </div>

            <div className="trip-selected-tickets__actions">
                <button
                    type="button"
                    className="trip-selected-tickets__button"
                    onClick={handleCheckout}
                    disabled={!canCheckout || isProcessing}
                >
                    {isProcessing ? "Đang xử lý..." : "Tiếp tục thanh toán →"}
                </button>
            </div>
        </div>
    );
}
