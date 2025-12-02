import axiosClient from "../apis/axiosClient";

export const adminNotificationService = {
    async list(limit = 20, page = 1, filters = {}) {
        const params = { limit, page, ...filters };
        const res = await axiosClient.get(`/admin/notifications`, { params });
        return res.data;
    },
    async markAsRead(id) {
        const res = await axiosClient.post(`/admin/notifications/${id}/read`);
        return res.data.data;
    },
    async markAllAsRead() {
        await axiosClient.post(`/admin/notifications/read-all`);
    },
    async markAsUnread(id) {
        const res = await axiosClient.post(`/admin/notifications/${id}/unread`);
        return res.data.data;
    },
};

