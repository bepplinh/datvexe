import { useState } from "react";
import { toast } from "react-toastify";
import MainLayout from "../../layout/MainLayout/MainLayout";
import "./CheckoutPage.scss";
import Steps from "./Steps/Steps";
import TicketSummary from "./components/TicketSummary";
import CheckoutActions from "./components/CheckoutActions";
import { useCheckout } from "../../contexts/CheckoutProvider";
import ContactStep from "./components/steps/ContactStep";
import PaymentStep from "./components/steps/PaymentStep";
import ConfirmationStep from "./components/steps/ConfirmationStep";
import { updateDraftPayment as updateDraftPaymentService } from "../../services/draftService";
import { mapContactFormToDraftPayload } from "./utils/contactMapper";

function CheckoutPage() {
    const {
        draftId,
        draftData,
        isLoadingDraft,
        contactInfo,
        updateContactInfo,
        currentStep,
        nextStep,
        paymentMethod,
        selectPaymentMethod,
        setResultBooking,
    } = useCheckout();

    const [isSubmitting, setIsSubmitting] = useState(false);

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
                const payload = mapContactFormToDraftPayload(contactInfo, {
                    paymentMethod,
                    draftTrips: draftData?.trips ?? [],
                });
                const result = await updateDraftPaymentService(
                    draftId,
                    payload
                );

                setResultBooking(result);

                if (result.success) {
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

                        {renderStepContent()}

                        {currentStep < 3 && (
                            <CheckoutActions
                                onContinue={handleContinue}
                                isSubmitting={isSubmitting}
                                label={actionLabel}
                            />
                        )}
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}

export default CheckoutPage;
