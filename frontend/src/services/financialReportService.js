import apiClient from "../apis/axiosClient";

export const financialReportService = {
    /**
     * Lấy tổng quan tài chính
     * @param {Object} params - { from_date, to_date, period }
     */
    async getOverview(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.period) queryParams.append("period", params.period);

        const response = await apiClient.get(
            `/admin/financial-reports/overview?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Lấy báo cáo doanh thu
     * @param {Object} params - { from_date, to_date, period }
     */
    async getRevenue(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.period) queryParams.append("period", params.period);

        const response = await apiClient.get(
            `/admin/financial-reports/revenue?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Lấy báo cáo hoàn tiền
     * @param {Object} params - { from_date, to_date, period }
     */
    async getRefunds(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.period) queryParams.append("period", params.period);

        const response = await apiClient.get(
            `/admin/financial-reports/refunds?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Lấy báo cáo coupon
     * @param {Object} params - { from_date, to_date, period, limit }
     */
    async getCoupons(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.period) queryParams.append("period", params.period);
        if (params.limit) queryParams.append("limit", params.limit);

        const response = await apiClient.get(
            `/admin/financial-reports/coupons?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Lấy báo cáo đổi ghế/đổi chuyến
     * @param {Object} params - { from_date, to_date }
     */
    async getModifications(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);

        const response = await apiClient.get(
            `/admin/financial-reports/modifications?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Lấy đối soát
     * @param {Object} params - { from_date, to_date }
     */
    async getReconciliation(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);

        const response = await apiClient.get(
            `/admin/financial-reports/reconciliation?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Báo cáo khách hàng
     * @param {Object} params - { from_date, to_date, period, limit }
     */
    async getCustomers(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.period) queryParams.append("period", params.period);
        if (params.limit) queryParams.append("limit", params.limit);

        const response = await apiClient.get(
            `/admin/financial-reports/customers?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Báo cáo hủy/hoàn/đổi vé
     * @param {Object} params - { from_date, to_date, period }
     */
    async getCancellations(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);
        if (params.period) queryParams.append("period", params.period);

        const response = await apiClient.get(
            `/admin/financial-reports/cancellations?${queryParams.toString()}`
        );
        return response.data;
    },
};

