import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

export function useCheckoutFlow(
    draftId,
    draftData,
    isLoadingDraft,
    draftError,
    goToStep
) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [fatalError, setFatalError] = useState(null);
    const lastValidDraftId = useRef(null);

    // Update last valid draft ID when draftData loads successfully
    useEffect(() => {
        if (draftData && draftId) {
            lastValidDraftId.current = draftId;
            setFatalError(null);
        }
    }, [draftData, draftId]);

    // Handle PayOS redirects
    useEffect(() => {
        const paymentStatus = searchParams.get("payment_status");
        const message = searchParams.get("message");
        const step = searchParams.get("step");

        if (step === "3") {
            goToStep(3);
        }

        if (paymentStatus && message) {
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

            const newParams = new URLSearchParams(searchParams);
            newParams.delete("payment_status");
            newParams.delete("message");
            newParams.delete("step");
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, goToStep, setSearchParams]);

    // Handle draft access errors
    useEffect(() => {
        if (draftError && !isLoadingDraft) {
            const errorStatus =
                draftError.status || draftError.response?.status;
            const errorMessage =
                draftError.message || draftError.response?.data?.message;

            if (
                lastValidDraftId.current &&
                lastValidDraftId.current !== draftId
            ) {
                toast.warning(
                    "Bạn không có quyền truy cập đơn đặt vé này. Đã quay lại đơn cũ."
                );
                setSearchParams(
                    { draft_id: lastValidDraftId.current },
                    { replace: true }
                );
                return;
            }

            if (
                errorStatus === 403 ||
                errorMessage?.includes("không có quyền")
            ) {
                setFatalError({
                    title: "Không có quyền truy cập",
                    subTitle:
                        errorMessage ||
                        "Bạn không có quyền xem đơn đặt vé này.",
                    status: "403",
                });
            } else if (
                errorStatus === 404 ||
                errorMessage?.includes("không tồn tại")
            ) {
                setFatalError({
                    title: "Không tìm thấy",
                    subTitle:
                        errorMessage ||
                        "Đơn đặt vé không tồn tại hoặc đã hết hạn.",
                    status: "404",
                });
            } else if (
                errorStatus === 422 ||
                errorMessage?.includes("hết hiệu lực")
            ) {
                setFatalError({
                    title: "Đơn hết hiệu lực",
                    subTitle:
                        errorMessage ||
                        "Đơn đặt vé này đã hết hiệu lực hoặc đã được xử lý.",
                    status: "error",
                });
            }
        }
    }, [draftError, isLoadingDraft, draftId, setSearchParams]);

    return {
        fatalError,
    };
}
