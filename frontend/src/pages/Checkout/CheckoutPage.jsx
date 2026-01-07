import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import MainLayout from "../../layout/MainLayout/MainLayout";
import "./CheckoutPage.scss";
import Steps from "./Steps/Steps";
import TicketSummary from "./components/TicketSummary";
import CheckoutActions from "./components/CheckoutActions";
import { useCheckout } from "../../contexts/useCheckout";
import ContactStep from "./components/steps/ContactStep";
import PaymentStep from "./components/steps/PaymentStep";
import ConfirmationStep from "./components/steps/ConfirmationStep";
import { updateDraftPayment as updateDraftPaymentService } from "../../services/draftService";
import { validateCoupon } from "../../services/couponService";
import { mapContactFormToDraftPayload } from "./utils/contactMapper";
import CountdownTimer from "./components/CountdownTimer/CountdownTimer";
import { Button, Typography, Box, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BlockIcon from "@mui/icons-material/Block";

function CheckoutPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        draftId,
        draftData,
        isLoadingDraft,
        draftError,
        contactInfo,
        updateContactInfo,
        currentStep,
        nextStep,
        prevStep,
        goToStep,
        paymentMethod,
        selectPaymentMethod,
        setResultBooking,
        couponCode,
        updateCouponCode,
    } = useCheckout();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [couponId, setCouponId] = useState(null);
    const [couponMessage, setCouponMessage] = useState("");
    const [isCouponChecking, setIsCouponChecking] = useState(false);
    const [isCouponValid, setIsCouponValid] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const couponTimerRef = useRef(null);

    // Track last valid draft ID
    const lastValidDraftId = useRef(null);
    const [fatalError, setFatalError] = useState(null);

    // Update last valid draft ID when draftData loads successfully
    useEffect(() => {
        if (draftData && draftId) {
            lastValidDraftId.current = draftId;
            setFatalError(null);
        }
    }, [draftData, draftId]);

    // Xử lý redirect từ PayOS
    useEffect(() => {
        const paymentStatus = searchParams.get("payment_status");
        const message = searchParams.get("message");
        const step = searchParams.get("step");

        if (step === "3") {
            goToStep(3);
        }

        if (paymentStatus && message) {
            // Decode message
            const decodedMessage = decodeURIComponent(message);

            if (paymentStatus === "success") {
                toast.success(decodedMessage);
            } else if (paymentStatus === "cancelled") {
                toast.success(decodedMessage || "Bạn đã hủy thanh toán.");
            } else if (paymentStatus === "failed") {
                toast.error(decodedMessage);
            } else if (paymentStatus === "processing") {
                toast.info(decodedMessage);
            }

            // Xóa query params sau khi hiển thị thông báo
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("payment_status");
            newParams.delete("message");
            newParams.delete("step");
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, goToStep, setSearchParams]);

    // Debounce validate coupon when user types
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
                const orderAmount = draftData?.total_price ??
                    (draftData?.trips || []).reduce((sum, trip) => {
                        return sum + (trip.total_price ||
                            (trip.seats || []).reduce((seatSum, seat) => seatSum + (seat.price || 0), 0));
                    }, 0);

                console.log("🔍 Validating coupon with orderAmount:", {
                    code,
                    orderAmount,
                    draftDataTotalPrice: draftData?.total_price,
                    draftDataTrips: draftData?.trips,
                });

                const validateRes = await validateCoupon(code, orderAmount);

                console.log("📦 Full API Response:", validateRes);

                // Response structure: { success: true, data: { valid: true, coupon: {...}, discount_amount: 12345 }, message: "..." }
                // validateRes là res.data từ axios, nên structure là: { success, data: {...}, message }
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
                    // Lưu thông tin discount từ response
                    // Response structure: { success: true, data: { valid: true, coupon: {...}, discount_amount: 12345 }, message: "..." }
                    const discountAmount =
                        validateRes?.data?.discount_amount ?? // Lấy từ data.discount_amount (đúng structure)
                        validateRes?.discount_amount ??        // Fallback
                        resolvedCoupon?.discount_amount ??    // Fallback từ coupon object
                        0;

                    console.log("✅ Coupon validated successfully:", {
                        fullResponse: validateRes,
                        data: validateRes?.data,
                        discount_amount_from_data: validateRes?.data?.discount_amount,
                        discount_amount_final: discountAmount,
                        coupon: resolvedCoupon,
                        orderAmount: orderAmount,
                    });

                    setCouponMessage("Áp dụng mã giảm giá thành công.");
                    setCouponId(resolvedCoupon.id);
                    setIsCouponValid(true);
                    setCouponDiscount(Number(discountAmount) || 0); // Đảm bảo là số
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

    const validateContactInfo = () => {
        if (!contactInfo.name?.trim()) {
            return "Vui lòng nhập họ tên hành khách.";
        }
        if (!contactInfo.phone?.trim()) {
            return "Vui lòng nhập số điện thoại hành khách.";
        }
        if (contactInfo.isProxyBooking) {
            if (!contactInfo.bookerName?.trim()) {
                return "Vui lòng nhập họ tên người đặt hộ.";
            }
            if (!contactInfo.bookerPhone?.trim()) {
                return "Vui lòng nhập số điện thoại người đặt hộ.";
            }
        }
        return null;
    };

    const handleContinue = async () => {
        if (isSubmitting) return;

        if (currentStep === 1) {
            const validationError = validateContactInfo();
            if (validationError) {
                toast.error(validationError);
                return;
            }
            nextStep();
            return;
        }

        if (currentStep === 2) {
            if (!paymentMethod) {
                toast.error("Vui lòng chọn phương thức thanh toán.");
                return;
            }

            if (!draftId) {
                toast.error("Không tìm thấy draft đặt vé. Vui lòng thử lại.");
                return;
            }

            try {
                setIsSubmitting(true);
                if (couponCode?.trim()) {
                    if (!isCouponValid || !couponId) {
                        toast.error("Vui lòng kiểm tra mã giảm giá trước khi tiếp tục.");
                        setIsSubmitting(false);
                        return;
                    }
                } else {
                    setCouponId(null);
                }

                const payload = mapContactFormToDraftPayload(contactInfo, {
                    paymentMethod,
                    draftTrips: draftData?.trips ?? [],
                    couponId,
                });
                const result = await updateDraftPaymentService(
                    draftId,
                    payload
                );

                setResultBooking(result);

                if (result.success) {
                    if (paymentMethod === "payos" && result.data?.payment_url) {
                        toast.success(
                            "Đang chuyển hướng đến trang thanh toán..."
                        );
                        window.location.href = result.data.payment_url;
                        return;
                    }

                    // Các payment method khác (cash, etc.)
                    toast.success("Thanh toán thành công.");
                    nextStep();
                } else {
                    toast.error(
                        result.message ||
                        "Không thể lưu thông tin thanh toán. Vui lòng thử lại."
                    );
                }
            } catch (error) {
                console.error(error);
                toast.error("Không thể cập nhật thông tin. Vui lòng thử lại.");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }
    };

    const handleExpired = useCallback(() => {
        toast.error("Thời gian giữ chỗ đã hết hạn !.");
        setTimeout(() => {
            navigate("/trip");
        }, 1000);
    }, [navigate]);

    // Xử lý lỗi khi không có quyền truy cập draft (403) hoặc draft không tồn tại (404)
    useEffect(() => {
        if (draftError && !isLoadingDraft) {
            const errorStatus = draftError.status || draftError.response?.status;
            const errorMessage = draftError.message || draftError.response?.data?.message;

            // Check if we have a previously known valid draft ID
            if (lastValidDraftId.current && lastValidDraftId.current !== draftId) {
                // If user changed URL manually from a valid one, revert it
                toast.warning("Bạn không có quyền truy cập đơn đặt vé này. Đã quay lại đơn cũ.");
                setSearchParams({ draft_id: lastValidDraftId.current }, { replace: true });
                return;
            }

            // If no previous valid ID (direct access to invalid URL), show fatal error
            if (errorStatus === 403 || errorMessage?.includes("không có quyền")) {
                setFatalError({
                    title: "Không có quyền truy cập",
                    subTitle: errorMessage || "Bạn không có quyền xem đơn đặt vé này.",
                    status: "403"
                });
            } else if (errorStatus === 404 || errorMessage?.includes("không tồn tại")) {
                setFatalError({
                    title: "Không tìm thấy",
                    subTitle: errorMessage || "Đơn đặt vé không tồn tại hoặc đã hết hạn.",
                    status: "404"
                });
            } else if (errorStatus === 422 || errorMessage?.includes("hết hiệu lực")) {
                setFatalError({
                    title: "Đơn hết hiệu lực",
                    subTitle: errorMessage || "Đơn đặt vé này đã hết hiệu lực hoặc đã được xử lý.",
                    status: "error"
                });
            }
        }
    }, [draftError, isLoadingDraft, draftId, setSearchParams]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <ContactStep
                        contactInfo={contactInfo}
                        onChange={updateContactInfo}
                    />
                );
            case 2:
                return (
                    <PaymentStep
                        selectedMethod={paymentMethod}
                        onSelect={selectPaymentMethod}
                        couponCode={couponCode}
                        onCouponChange={updateCouponCode}
                        couponMessage={couponMessage}
                        isCouponChecking={isCouponChecking}
                        isCouponValid={isCouponValid}
                    />
                );
            case 3:
                return (
                    <ConfirmationStep
                        contactInfo={contactInfo}
                        paymentMethod={paymentMethod}
                    />
                );
            default:
                return null;
        }
    };

    const actionLabel =
        currentStep === 1
            ? "Tiếp tục"
            : currentStep === 2
                ? "Đặt vé"
                : "Hoàn tất";

    if (fatalError) {
        let IconComponent = ErrorOutlineIcon;
        let color = "error";

        if (fatalError.title.includes("quyền")) {
            IconComponent = BlockIcon;
        } else if (fatalError.title.includes("tìm thấy")) {
            IconComponent = WarningAmberIcon;
            color = "warning";
        }

        return (
            <MainLayout>
                <div style={{ padding: "50px 20px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            maxWidth: 500,
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <IconComponent sx={{ fontSize: 60 }} color={color} />
                        <Typography variant="h5" component="h2" gutterBottom>
                            {fatalError.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            {fatalError.subTitle}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate("/trip")}
                            size="large"
                        >
                            Về trang tìm vé
                        </Button>
                    </Paper>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="checkout">
                <div className="checkout__grid">
                    <aside className="checkout__summary">
                        <TicketSummary
                            ticket={draftData}
                            isLoading={isLoadingDraft}
                            isCouponValid={isCouponValid}
                            couponDiscount={couponDiscount}
                        />
                    </aside>

                    <section className="checkout__content">
                        <div className="stepContainer">
                            <Steps />
                        </div>

                        {draftData?.expires_at && currentStep < 3 && (
                            <CountdownTimer
                                expiresAt={draftData.expires_at}
                                onExpired={handleExpired}
                            />
                        )}

                        {renderStepContent()}

                        {currentStep < 3 && (
                            <CheckoutActions
                                onContinue={handleContinue}
                                onBack={prevStep}
                                isSubmitting={isSubmitting}
                                label={actionLabel}
                                showBack={currentStep > 1}
                            />
                        )}
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}

export default CheckoutPage;
