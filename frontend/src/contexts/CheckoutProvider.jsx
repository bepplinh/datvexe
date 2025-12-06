import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDraft } from "../hooks/useDraft";
import { mapDraftContactToForm } from "../pages/Checkout/utils/contactMapper";
import { CheckoutContext } from "./CheckoutContext";

const defaultContactInfo = {
    name: "",
    countryCode: "+84",
    phone: "",
    note: "",
    pickup: "",
    dropoff: "",
    isProxyBooking: false,
    bookerName: "",
    bookerPhone: "",
};

export const CheckoutProvider = ({ children }) => {
    const [searchParams] = useSearchParams();
    const draftId = searchParams.get("draft_id");
    const {
        draftData,
        isLoading: isLoadingDraft,
        error: draftError,
        refetch: refetchDraft,
    } = useDraft(draftId);

    const [contactInfo, setContactInfo] = useState(defaultContactInfo);
    const [currentStep, setCurrentStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [resultBooking, setResultBooking] = useState(null);
    const [couponCode, setCouponCode] = useState("");

    // Sync contact info từ draft data khi draft được load
    useEffect(() => {
        if (draftData?.contact) {
            const mappedContact = mapDraftContactToForm(
                draftData.contact,
                defaultContactInfo
            );
            setContactInfo(mappedContact);
        }
    }, [draftData]);

    const updateContactInfo = useCallback((field, value) => {
        setContactInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const updateContactInfoBatch = useCallback((updates) => {
        setContactInfo((prev) => ({
            ...prev,
            ...updates,
        }));
    }, []);

    const goToStep = useCallback((step) => {
        if (step >= 1 && step <= 3) {
            setCurrentStep(step);
        }
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    }, []);

    const selectPaymentMethod = useCallback((method) => {
        setPaymentMethod(method);
    }, []);

    const updateCouponCode = useCallback((value) => {
        setCouponCode(value);
    }, []);

    const value = useMemo(
        () => ({
            // Draft data
            draftId,
            draftData,
            isLoadingDraft,
            draftError,
            refetchDraft,

            // Contact info
            contactInfo,
            updateContactInfo,
            updateContactInfoBatch,

            // Steps
            currentStep,
            goToStep,
            nextStep,
            prevStep,

            // Payment
            paymentMethod,
            selectPaymentMethod,
            resultBooking,
            setResultBooking,

            // Coupon
            couponCode,
            updateCouponCode,
        }),
        [
            draftId,
            draftData,
            isLoadingDraft,
            draftError,
            refetchDraft,
            contactInfo,
            updateContactInfo,
            updateContactInfoBatch,
            currentStep,
            goToStep,
            nextStep,
            prevStep,
            paymentMethod,
            selectPaymentMethod,
            resultBooking,
            couponCode,
            updateCouponCode,
        ]
    );

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );
};
