import { useState, useRef, useEffect } from "react";
import { validateCoupon } from "../../../services/couponService";

export function useCheckoutCoupon(draftData, couponCodeInitial = "") {
    const [couponCode, setCouponCode] = useState(couponCodeInitial);
    const [couponId, setCouponId] = useState(null);
    const [couponMessage, setCouponMessage] = useState("");
    const [isCouponChecking, setIsCouponChecking] = useState(false);
    const [isCouponValid, setIsCouponValid] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const couponTimerRef = useRef(null);

    const updateCouponCode = (code) => {
        setCouponCode(code);
    };

    useEffect(() => {
        if (couponTimerRef.current) {
            clearTimeout(couponTimerRef.current);
        }

        const code = couponCode?.trim();
        if (!code) {
            setCouponId(null);
            setCouponMessage("");
            setIsCouponValid(false);
            setIsCouponChecking(false);
            setCouponDiscount(0);
            return;
        }

        setIsCouponChecking(true);
        setIsCouponValid(false);
        setCouponMessage("Đang kiểm tra mã giảm giá...");

        couponTimerRef.current = setTimeout(async () => {
            try {
                // Tính orderAmount từ draftData
                const orderAmount =
                    draftData?.total_price ??
                    (draftData?.trips || []).reduce((sum, trip) => {
                        return (
                            sum +
                            (trip.total_price ||
                                (trip.seats || []).reduce(
                                    (seatSum, seat) =>
                                        seatSum + (seat.price || 0),
                                    0
                                ))
                        );
                    }, 0);

                const validateRes = await validateCoupon(code, orderAmount);

                const isValid =
                    validateRes?.data?.valid ??
                    validateRes?.valid ??
                    validateRes?.success ??
                    false;

                const resolvedCoupon =
                    validateRes?.data?.coupon ||
                    validateRes?.coupon ||
                    validateRes?.data?.data?.coupon;

                if (!isValid || !resolvedCoupon?.id) {
                    const message =
                        validateRes?.data?.message ||
                        validateRes?.message ||
                        "Mã giảm giá không hợp lệ.";
                    setCouponMessage(message);
                    setCouponId(null);
                    setIsCouponValid(false);
                    setCouponDiscount(0);
                } else {
                    const discountAmount =
                        validateRes?.data?.discount_amount ??
                        validateRes?.discount_amount ??
                        resolvedCoupon?.discount_amount ??
                        0;

                    setCouponMessage("Áp dụng mã giảm giá thành công.");
                    setCouponId(resolvedCoupon.id);
                    setIsCouponValid(true);
                    setCouponDiscount(Number(discountAmount) || 0);
                }
            } catch (err) {
                console.error("Validate coupon failed", err);
                setCouponMessage(
                    err?.response?.data?.message ||
                        "Không thể kiểm tra mã giảm giá."
                );
                setCouponId(null);
                setIsCouponValid(false);
                setCouponDiscount(0);
            } finally {
                setIsCouponChecking(false);
            }
        }, 500);

        return () => {
            if (couponTimerRef.current) {
                clearTimeout(couponTimerRef.current);
            }
        };
    }, [couponCode, draftData]);

    return {
        couponCode,
        updateCouponCode,
        couponId,
        setCouponId,
        couponMessage,
        isCouponChecking,
        isCouponValid,
        couponDiscount,
    };
}
