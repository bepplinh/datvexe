import dayjs from "dayjs";
import "dayjs/locale/vi";
import updateLocale from "dayjs/plugin/updateLocale";

// Initialize dayjs locale configuration
dayjs.extend(updateLocale);
dayjs.updateLocale("vi", {
    weekStart: 1, // Monday
});
dayjs.locale("vi");

/**
 * Format date to DD/MM/YYYY format
 * @param {dayjs.Dayjs|Date|string|null} date - Date to format
 * @returns {string} Formatted date string or "DD/MM/YYYY" placeholder
 */
export const formatDate = (date) => {
    if (!date) return "DD/MM/YYYY";
    if (dayjs.isDayjs(date)) {
        return date.format("DD/MM/YYYY");
    }
    return dayjs(date).format("DD/MM/YYYY");
};

/**
 * Get minimum selectable date (today)
 * @returns {dayjs.Dayjs}
 */
export const getMinDate = () => dayjs();

/**
 * Get maximum selectable date (6 months from today)
 * @returns {dayjs.Dayjs}
 */
export const getMaxDate = () => dayjs().add(6, "month");

