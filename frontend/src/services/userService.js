import apiClient from "../apis/axiosClient";

export const userService = {
    // Lấy danh sách users với phân trang và tìm kiếm
    async getUsers(params = {}) {
        const { keyword, per_page = 15, page = 1 } = params;
        const queryParams = new URLSearchParams({
            per_page: per_page.toString(),
            page: page.toString(),
        });

        if (keyword) {
            queryParams.append("keyword", keyword);
        }

        const response = await apiClient.get(
            `/users?${queryParams.toString()}`
        );
        return response.data;
    },

    // Lấy thông tin chi tiết user
    async getUserById(id) {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },

    // Tạo mới user
    async createUser(userData) {
        const response = await apiClient.post("/users", userData);
        return response.data;
    },

    // Cập nhật user
    async updateUser(id, userData) {
        const response = await apiClient.put(`/users/${id}`, userData);
        return response.data;
    },

    // Xóa user
    async deleteUser(id) {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    },
};
