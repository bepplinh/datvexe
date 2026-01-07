import apiClient from "../../apis/axiosClient";

export const realTimeService = {
    /**
     * Metrics real-time
     */
    async getMetrics() {
        const res = await apiClient.get("/admin/realtime/metrics");
        return res.data;
    },


    /**
     * Chuyến sắp khởi hành hôm nay
     * @param {Object} params - { limit: number }
     */
    async getUpcomingTrips(params = {}) {
        const {
            limit = 10
        } = params;
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });

        const res = await apiClient.get(
            `/admin/realtime/upcoming-trips?${queryParams.toString()}`
        );
        return res.data;
    },
};

