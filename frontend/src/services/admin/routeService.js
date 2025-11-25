import axiosClient from "../../apis/axiosClient";

export const adminRouteService = {
    async getRoutes(params = {}) {
        const {
            search,
            from_city,
            to_city,
            created_from,
            created_to,
            per_page,
            page,
        } = params;

        const queryParams = new URLSearchParams();

        if (per_page) queryParams.append("per_page", String(per_page));
        if (page) queryParams.append("page", String(page));
        if (search) queryParams.append("search", search);
        if (from_city) queryParams.append("from_city", from_city);
        if (to_city) queryParams.append("to_city", to_city);
        if (created_from) queryParams.append("created_from", created_from);
        if (created_to) queryParams.append("created_to", created_to);

        const queryString = queryParams.toString();
        const url = queryString ? `/routes?${queryString}` : "/routes";
        const response = await axiosClient.get(url);
        return response.data;
    },

    async getRouteById(id) {
        const response = await axiosClient.get(`/routes/${id}`);
        return response.data;
    },

    async createRoute(data) {
        const response = await axiosClient.post("/routes", data);
        return response.data;
    },

    async updateRoute(id, data) {
        const response = await axiosClient.put(`/routes/${id}`, data);
        return response.data;
    },

    async deleteRoute(id) {
        const response = await axiosClient.delete(`/routes/${id}`);
        return response.data;
    },
};
