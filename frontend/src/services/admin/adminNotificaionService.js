import axiosClient from "../../apis/axiosClient";

export const adminNotificationService = {
    async list(limit = 20) {
        const res = await axiosClient.get(`/admin/notifications`, { params: { limit } });
        return res.data;
    },
    async markAsRead(id) {
        const res = await axiosClient.post(`/admin/notifications/${id}/read`);
        return res.data.data;
    },
    async markAllAsRead() {
        await axiosClient.post(`/admin/notifications/read-all`);
    }
}