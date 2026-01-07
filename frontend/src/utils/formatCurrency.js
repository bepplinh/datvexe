/**
 * Format số tiền VND
 * @param {number} amount - Số tiền
 * @param {boolean} showSymbol - Hiển thị ký hiệu VND
 * @returns {string}
 */
export function formatCurrency(amount, showSymbol = true) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return showSymbol ? "0 ₫" : "0";
    }

    const formatted = new Intl.NumberFormat("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    return showSymbol ? `${formatted} ₫` : formatted;
}

/**
 * Format số với dấu phẩy
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0";
    }

    return new Intl.NumberFormat("vi-VN").format(value);
}

/**
 * Format phần trăm
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0%";
    }

    return `${value.toFixed(decimals)}%`;
}
