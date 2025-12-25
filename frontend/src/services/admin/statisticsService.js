import apiClient from "../../apis/axiosClient";

export const statisticsService = {
    /**
     * Thống kê booking
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', status: 'paid'|'pending'|'cancelled'|'all' }
     */
    async getBookingStatistics(params = {}) {
        const {
            from_date, to_date, status = "all"
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);
        if (status) queryParams.append("status", status);

        const res = await apiClient.get(
            `/admin/statistics/bookings?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Top khách hàng
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', limit: number, sort_by: 'booking_count'|'revenue' }
     */
    async getTopCustomers(params = {}) {
        const {
            from_date, to_date, limit = 10, sort_by = "booking_count"
        } = params;
        const queryParams = new URLSearchParams({
            limit: limit.toString(),
            sort_by
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/statistics/top-customers?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Phân tích khách hàng mới vs quay lại
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getCustomerSegmentation(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/statistics/customer-segmentation?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Phân bố khách hàng theo địa điểm
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getCustomerDistribution(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/statistics/customer-distribution?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Lịch sử đặt vé của khách hàng
     * @param {number} userId - ID khách hàng
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getCustomerHistory(userId, params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/statistics/customer-history/${userId}?${queryParams.toString()}`
        );
        return res.data;
    },
};

