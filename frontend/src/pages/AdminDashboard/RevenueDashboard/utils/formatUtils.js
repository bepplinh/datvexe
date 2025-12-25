// Format số tiền
export const formatCurrency = (amount) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

// Format số
export const formatNumber = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat("vi-VN").format(num);
};

