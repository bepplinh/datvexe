import { ArrowLeft } from "lucide-react";

function CheckoutActions({
    onContinue,
    onBack,
    isSubmitting = false,
    label = "Tiếp tục",
    showBack = false,
}) {
    return (
        <div className="checkout__actions">
            {showBack && onBack ? (
                <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    <ArrowLeft className="btn__icon" size={18} />
                    Trở về
                </button>
            ) : (
                <div></div>
            )}
            <button
                type="button"
                className="btn btn--primary"
                onClick={onContinue}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Đang xử lý..." : label}
            </button>
        </div>
    );
}

export default CheckoutActions;
