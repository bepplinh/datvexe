import axiosClient from "../apis/axiosClient";

export const userNotificationService = {
    /**
     * Lấy danh sách thông báo của user
     * @param {number} limit - Số lượng thông báo tối đa
     * @param {number} page - Trang hiện tại
     * @param {Object} filters - Các bộ lọc (is_read, type)
     */
    async list(limit = 20, page = 1, filters = {}) {
        const params = { limit, page, ...filters };
        const response = await axiosClient.get("/user/notifications", {
            params,
        });
        return response.data;
    },

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    async getUnreadCount() {
        const response = await axiosClient.get(
            "/user/notifications/unread-count"
        );
        return response.data;
    },

    /**
     * Đánh dấu một thông báo là đã đọc
     * @param {number} notificationId
     */
    async markAsRead(notificationId) {
        const response = await axiosClient.post(
            `/user/notifications/${notificationId}/read`
        );
        return response.data;
    },

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    async markAllAsRead() {
        const response = await axiosClient.post("/user/notifications/read-all");
        return response.data;
    },
};

export default userNotificationService;
