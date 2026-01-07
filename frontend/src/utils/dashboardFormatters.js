import dayjs from "dayjs";

/**
 * Format currency VND
 */
export const formatCurrency = (value) => {
    if (!value && value !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
};

/**
 * Format số với đơn vị
 */
export const formatNumber = (value, unit = "") => {
    if (!value && value !== 0) return `0 ${unit}`;
    const formatted = new Intl.NumberFormat("vi-VN").format(value);
    return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Format phần trăm
 */
export const formatPercentage = (value, decimals = 2) => {
    if (!value && value !== 0) return "0%";
    return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format ngày theo định dạng Việt Nam
 * @param {string|Date} date - Ngày cần format
 * @param {string} format - Định dạng: 'date', 'datetime', 'month', 'year'
 */
export const formatDate = (date, format = "date") => {
    if (!date) return "";

    const dateObj = dayjs(date);

    switch (format) {
        case "date":
            return dateObj.format("DD/MM/YYYY");
        case "datetime":
            return dateObj.format("DD/MM/YYYY HH:mm");
        case "month":
            return dateObj.format("MM/YYYY");
        case "year":
            return dateObj.format("YYYY");
        case "full":
            return dateObj.format("DD/MM/YYYY HH:mm:ss");
        default:
            return dateObj.format("DD/MM/YYYY");
    }
};

/**
 * Format period label cho chart
 */
export const formatPeriodLabel = (period, periodType) => {
    if (!period) return "";

    // Nếu period là string đơn giản (như "Kỳ trước", "Kỳ hiện tại"), trả về luôn
    if (typeof period === "string" && !period.match(/^\d{4}/) && !period.match(/^\d{4}-\d{2}/)) {
        return period;
    }

    switch (periodType) {
        case "day":
            return formatDate(period, "date");
        case "week":
            return `Tuần ${period}`;
        case "month":
            return formatDate(period, "month");
        case "quarter":
            return period; // Format: "2024-Q1"
        case "year":
            return period; // Format: "2024"
        default:
            return period;
    }
};

/**
 * Tính % tăng trưởng và trả về object với trend
 */
export const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) {
        return {
            value: current > 0 ? 100 : 0,
            isPositive: current > 0,
            isNegative: false,
            isNeutral: current === 0,
        };
    }

    const growth = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(growth),
        isPositive: growth > 0,
        isNegative: growth < 0,
        isNeutral: growth === 0,
    };
};

/**
 * Format số lớn (K, M)
 */
export const formatLargeNumber = (value) => {
    if (!value && value !== 0) return "0";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toLocaleString("vi-VN");
};

