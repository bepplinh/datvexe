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
    const couponTimerRef = useRef(null);

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
            } else if (
                paymentStatus === "failed" ||
                paymentStatus === "cancelled"
            ) {
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
            return;
        }

        setIsCouponChecking(true);
        setIsCouponValid(false);
        setCouponMessage("Đang kiểm tra mã giảm giá...");

        couponTimerRef.current = setTimeout(async () => {
            try {
                const validateRes = await validateCoupon(
                    code,
                    draftData?.total_price ?? 0
                );

                const isValid =
                    validateRes?.valid ?? validateRes?.success ?? false;
                const resolvedCoupon =
                    validateRes?.coupon ||
                    validateRes?.data?.coupon ||
                    validateRes?.data?.data?.coupon;

                if (!isValid || !resolvedCoupon?.id) {
                    const message =
                        validateRes?.message ||
                        validateRes?.data?.message ||
                        "Mã giảm giá không hợp lệ.";
                    setCouponMessage(message);
                    setCouponId(null);
                    setIsCouponValid(false);
                } else {
                    setCouponMessage("Áp dụng mã giảm giá thành công.");
                    setCouponId(resolvedCoupon.id);
                    setIsCouponValid(true);
                }
            } catch (err) {
                console.error("Validate coupon failed", err);
                setCouponMessage(
                    err?.response?.data?.message ||
                    "Không thể kiểm tra mã giảm giá."
                );
                setCouponId(null);
                setIsCouponValid(false);
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

            if (errorStatus === 403 || errorMessage?.includes("không có quyền")) {
                toast.error(
                    errorMessage || "Bạn không có quyền truy cập đơn đặt vé này. Vui lòng tạo đơn mới."
                );
                setTimeout(() => {
                    navigate("/trip");
                }, 2000);
            } else if (errorStatus === 404 || errorMessage?.includes("không tồn tại")) {
                toast.error(
                    errorMessage || "Đơn đặt vé không tồn tại hoặc đã hết hạn."
                );
                setTimeout(() => {
                    navigate("/trip");
                }, 2000);
            } else if (errorStatus === 422 || errorMessage?.includes("hết hiệu lực")) {
                toast.error(
                    errorMessage || "Đơn đặt vé này đã hết hiệu lực hoặc đã được xử lý."
                );
                setTimeout(() => {
                    navigate("/trip");
                }, 2000);
            }
        }
    }, [draftError, isLoadingDraft, navigate]);

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

    return (
        <MainLayout>
            <div className="checkout">
                <div className="checkout__grid">
                    <aside className="checkout__summary">
                        <TicketSummary
                            ticket={draftData}
                            isLoading={isLoadingDraft}
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
