function CheckoutActions({
    onContinue,
    isSubmitting = false,
    label = "Tiếp tục",
}) {
    return (
        <div className="checkout__actions">
            <div className="checkout__button">
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={onContinue}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Đang xử lý..." : label}
                </button>
            </div>
        </div>
    );
}

export default CheckoutActions;
