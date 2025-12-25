import apiClient from "../../apis/axiosClient";

export const tripPerformanceService = {
    /**
     * Tỷ lệ lấp đầy theo chuyến/tuyến
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', route_id: number }
     */
    async getOccupancy(params = {}) {
        const {
            from_date, to_date, route_id
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);
        if (route_id) queryParams.append("route_id", route_id);

        const res = await apiClient.get(
            `/admin/trip-performance/occupancy?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Chuyến có tỷ lệ lấp đầy thấp
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', threshold: number, limit: number }
     */
    async getLowOccupancy(params = {}) {
        const {
            from_date, to_date, threshold = 50, limit = 20
        } = params;
        const queryParams = new URLSearchParams({
            threshold: threshold.toString(),
            limit: limit.toString()
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/low-occupancy?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Doanh thu trung bình mỗi chuyến
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getAverageRevenue(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/average-revenue?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Chuyến phổ biến nhất
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', limit: number }
     */
    async getPopularTrips(params = {}) {
        const {
            from_date, to_date, limit = 10
        } = params;
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/popular-trips?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Thời gian khởi hành phổ biến nhất
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getPopularDepartureTimes(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/popular-departure-times?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Ghế được đặt nhiều nhất
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', limit: number }
     */
    async getMostBookedSeats(params = {}) {
        const {
            from_date, to_date, limit = 20
        } = params;
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/most-booked-seats?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Ghế ít được đặt
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', limit: number }
     */
    async getLeastBookedSeats(params = {}) {
        const {
            from_date, to_date, limit = 20
        } = params;
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/least-booked-seats?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Tỷ lệ sử dụng ghế theo loại
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getSeatUsageByType(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/trip-performance/seat-usage-by-type?${queryParams.toString()}`
        );
        return res.data;
    },
};

