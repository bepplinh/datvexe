import dayjs from "dayjs";
import "dayjs/locale/vi";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

/**
 * Format ngày theo định dạng Việt Nam
 * @param {string|Date|dayjs.Dayjs} date
 * @param {string} format - Format mặc định: DD/MM/YYYY
 * @returns {string}
 */
export function formatDate(date, format = "DD/MM/YYYY") {
    if (!date) return "";
    return dayjs(date).format(format);
}

/**
 * Format ngày giờ
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {string}
 */
export function formatDateTime(date) {
    if (!date) return "";
    return dayjs(date).format("DD/MM/YYYY HH:mm");
}

/**
 * Format tháng/năm
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {string}
 */
export function formatMonthYear(date) {
    if (!date) return "";
    return dayjs(date).format("MM/YYYY");
}

/**
 * Format quý/năm
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {string}
 */
export function formatQuarterYear(date) {
    if (!date) return "";
    const d = dayjs(date);
    const quarter = Math.floor(d.month() / 3) + 1;
    return `Q${quarter}/${d.year()}`;
}

/**
 * Format năm
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {string}
 */
export function formatYear(date) {
    if (!date) return "";
    return dayjs(date).format("YYYY");
}

/**
 * Parse period string (YYYY-MM, YYYY-Q1, etc.) thành label hiển thị
 * @param {string} period
 * @param {string} periodType - day, week, month, quarter, year
 * @returns {string}
 */
export function formatPeriod(period, periodType = "month") {
    if (!period) return "";

    switch (periodType) {
        case "day":
            return formatDate(period, "DD/MM/YYYY");
        case "week": {
            // Format: YYYY-WW hoặc YYYYWW
            if (period.includes("-W")) {
                const [year, week] = period.split("-W");
                return `Tuần ${week}/${year}`;
            }
            // Format: YYYYWW
            const year = period.substring(0, 4);
            const week = period.substring(4);
            return `Tuần ${week}/${year}`;
        }
        case "month": {
            // Format: YYYY-MM
            if (period.includes("-")) {
                return formatMonthYear(period + "-01");
            }
            // Format: YYYYMM
            const monthYear = period.substring(0, 4);
            const month = period.substring(4);
            return formatMonthYear(`${monthYear}-${month}-01`);
        }
        case "quarter": {
            // Format: YYYY-Q1
            if (period.includes("-Q")) {
                const [qYear, qQuarter] = period.split("-Q");
                return `Q${qQuarter}/${qYear}`;
            }
            return period;
        }
        case "year":
            return period;
        default:
            return period;
    }
}