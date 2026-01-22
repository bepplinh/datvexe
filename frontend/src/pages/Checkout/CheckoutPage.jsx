import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
import { mapContactFormToDraftPayload } from "./utils/contactMapper";
import CountdownTimer from "./components/CountdownTimer/CountdownTimer";
import { Button, Typography, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BlockIcon from "@mui/icons-material/Block";
import { checkoutSchema } from "./schemas/checkoutSchema";
import { useCheckoutCoupon } from "./hooks/useCheckoutCoupon";
import { useCheckoutFlow } from "./hooks/useCheckoutFlow";

function CheckoutPage() {
    const navigate = useNavigate();
    const {
        draftId,
        draftData,
        isLoadingDraft,
        draftError,
        contactInfo,
        updateContactInfoBatch,
        currentStep,
        nextStep,
        prevStep,
        goToStep,
        paymentMethod,
        selectPaymentMethod,
        setResultBooking,
    } = useCheckout();

    // Form handling
    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
        getValues,
        setValue,
        watch,
        reset,
        control,
        clearErrors,
    } = useForm({
        resolver: yupResolver(checkoutSchema),
        defaultValues: contactInfo,
        mode: "onBlur",
    });

    useEffect(() => {
        if (contactInfo) {
            reset(contactInfo);
        }
    }, [contactInfo, reset]);

    // Custom Hooks
    const {
        couponCode,
        updateCouponCode,
        couponId,
        setCouponId,
        couponMessage,
        isCouponChecking,
        isCouponValid,
        couponDiscount,
    } = useCheckoutCoupon(draftData);

    const { fatalError } = useCheckoutFlow(
        draftId,
        draftData,
        isLoadingDraft,
        draftError,
        goToStep
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContinue = async () => {
        if (isSubmitting) return;

        if (currentStep === 1) {
            const isValid = await trigger();
            if (!isValid) return;

            updateContactInfoBatch(getValues());
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
                        toast.error(
                            "Vui lòng kiểm tra mã giảm giá trước khi tiếp tục."
                        );
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

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <ContactStep
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        clearErrors={clearErrors}
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
                <div
                    style={{
                        padding: "50px 20px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "60vh",
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            textAlign: "center",
                            maxWidth: 500,
                            borderRadius: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <IconComponent sx={{ fontSize: 60 }} color={color} />
                        <Typography variant="h5" component="h2" gutterBottom>
                            {fatalError.title}
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            paragraph
                        >
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
