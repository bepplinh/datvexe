import apiClient from "../../apis/axiosClient";

export const financialService = {
    /**
     * Báo cáo thanh toán
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getPaymentReport(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/financial/payment-report?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Phân tích coupon/khuyến mãi
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD' }
     */
    async getCouponAnalysis(params = {}) {
        const {
            from_date, to_date
        } = params;
        const queryParams = new URLSearchParams();
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/financial/coupon-analysis?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Top coupon hiệu quả nhất
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', limit: number }
     */
    async getTopCoupons(params = {}) {
        const {
            from_date, to_date, limit = 10
        } = params;
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/financial/top-coupons?${queryParams.toString()}`
        );
        return res.data;
    },

    /**
     * Báo cáo tài chính theo period
     * @param {Object} params - { from_date: 'YYYY-MM-DD', to_date: 'YYYY-MM-DD', period: 'day'|'week'|'month'|'quarter'|'year' }
     */
    async getReportByPeriod(params = {}) {
        const {
            from_date, to_date, period = "day"
        } = params;
        const queryParams = new URLSearchParams({
            period
        });
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);

        const res = await apiClient.get(
            `/admin/financial/report-by-period?${queryParams.toString()}`
        );
        return res.data;
    },
};

