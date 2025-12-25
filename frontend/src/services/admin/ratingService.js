import axiosClient from "../../apis/axiosClient";

export const adminRatingService = {
    async list(params = {}) {
        const res = await axiosClient.get("/admin/ratings", {
            params,
        });
        return res.data;
    },
    async summary(params = {}) {
        const res = await axiosClient.get("/admin/ratings/summary", {
            params,
        });
        return res.data;
    },
};
