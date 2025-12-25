/**
 * Format currency (VND)
 */
export const formatCurrency = (value) => {
    if (!value && value !== 0) return "-";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
};

/**
 * Format number with thousand separator
 */
export const formatNumber = (value) => {
    if (!value && value !== 0) return "-";
    return new Intl.NumberFormat("vi-VN").format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
    if (!value && value !== 0) return "-";
    return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format date
 */
export const formatDate = (date, format = "DD/MM/YYYY") => {
    if (!date) return "-";
    const dayjs = require("dayjs");
    return dayjs(date).format(format);
};

/**
 * Format datetime
 */
export const formatDateTime = (date, format = "DD/MM/YYYY HH:mm") => {
    if (!date) return "-";
    const dayjs = require("dayjs");
    return dayjs(date).format(format);
};

/**
 * Format large number (K, M)
 */
export const formatLargeNumber = (value) => {
    if (!value && value !== 0) return "-";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toLocaleString("vi-VN");
};

/**
 * Format duration (minutes to hours)
 */
export const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "-";
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}p` : `${hours} giờ`;
};

