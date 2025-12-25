import apiClient from "../../apis/axiosClient";

export const exportService = {
    /**
     * Export dữ liệu
     * @param {Object} params - { type: 'revenue'|'bookings'|'payments'|'financial', format: 'excel'|'pdf', from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', period: 'day'|'week'|'month'|'quarter'|'year' }
     */
    async exportData(params = {}) {
        const {
            type = "revenue",
            format = "excel",
            from_date,
            to_date,
            period = "day"
        } = params;
        const queryParams = new URLSearchParams({
            type,
            format,
            period
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/export?${queryParams.toString()}`
        );
        return res.data;
    },
};

