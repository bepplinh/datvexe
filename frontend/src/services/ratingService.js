import axiosClient from "../apis/axiosClient";

export const ratingService = {
    async getPending() {
        const res = await axiosClient.get("/ratings/pending");
        return res.data && res.data.data ? res.data.data : [];
    },

    async submitRating({
        tripId,
        payload
    }) {
        const res = await axiosClient.post(`/trips/${tripId}/ratings`, payload);
        return res.data;
    },
};