import apiClient from "../apis/axiosClient";

export const paymentService = {
    // Lấy danh sách payments với phân trang và filters
    async getPayments(params = {}) {
        const {
            page = 1,
            per_page = 20,
            provider,
            from_date,
            to_date,
            booking_code,
            search,
            all = false,
        } = params;

        const queryParams = new URLSearchParams();

        // Nếu all=true, không thêm page và per_page để lấy tất cả dữ liệu
        if (all) {
            queryParams.append("all", "true");
        } else {
            queryParams.append("page", page.toString());
            queryParams.append("per_page", per_page.toString());
        }

        if (provider) queryParams.append("provider", provider);
        if (from_date) queryParams.append("from_date", from_date);
        if (to_date) queryParams.append("to_date", to_date);
        if (booking_code) queryParams.append("booking_code", booking_code);
        if (search) queryParams.append("search", search);

        const response = await apiClient.get(
            `/admin/payments?${queryParams.toString()}`
        );
        return response.data;
    },

    // Lấy thông tin chi tiết payment
    async getPaymentById(id) {
        const response = await apiClient.get(`/admin/payments/${id}`);
        return response.data;
    },

    // Lấy thống kê payments
    async getPaymentStats(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.to_date) queryParams.append("to_date", params.to_date);

        const response = await apiClient.get(
            `/admin/payments/stats?${queryParams.toString()}`
        );
        return response.data;
    },
};
