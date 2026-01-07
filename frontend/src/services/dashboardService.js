import apiClient from "../apis/axiosClient";

export const dashboardService = {
    /**
     * Lấy tổng quan dashboard
     * @param {Object} params - { from_date, to_date }
     */
    async getOverview(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);

        const response = await apiClient.get(
            `/admin/dashboard/overview?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * So sánh theo kỳ
     * @param {Object} params - { period, from_date, to_date }
     */
    async getComparison(params) {
        const queryParams = new URLSearchParams();
        queryParams.append("period", params.period);
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);

        const response = await apiClient.get(
            `/admin/dashboard/comparison?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Lấy top metrics
     * @param {Object} params - { period, from_date, to_date, limit }
     */
    async getTopMetrics(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.period) queryParams.append("period", params.period);
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.limit) queryParams.append("limit", params.limit);

        const response = await apiClient.get(
            `/admin/dashboard/top-metrics?${queryParams.toString()}`
        );
        return response.data;
    },
};

