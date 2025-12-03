import axiosClient from "../../apis/axiosClient";

export const adminTripStationService = {
    async getTripStations(params = {}) {
        const {
            route_id,
            from_location_id,
            to_location_id,
            price_min,
            price_max,
            duration_min,
            duration_max,
            q,
            per_page,
            page,
            sort_by,
            sort_dir,
        } = params;

        const queryParams = new URLSearchParams();

        if (per_page) queryParams.append("per_page", String(per_page));
        if (page) queryParams.append("page", String(page));
        if (route_id) queryParams.append("route_id", route_id);
        if (from_location_id) queryParams.append("from_location_id", from_location_id);
        if (to_location_id) queryParams.append("to_location_id", to_location_id);
        if (price_min) queryParams.append("price_min", price_min);
        if (price_max) queryParams.append("price_max", price_max);
        if (duration_min) queryParams.append("duration_min", duration_min);
        if (duration_max) queryParams.append("duration_max", duration_max);
        if (q) queryParams.append("q", q);
        if (sort_by) queryParams.append("sort_by", sort_by);
        if (sort_dir) queryParams.append("sort_dir", sort_dir);

        const queryString = queryParams.toString();
        const url = queryString ? `/trip-stations?${queryString}` : "/trip-stations";
        const response = await axiosClient.get(url);
        return response.data;
    },

    async getTripStationById(id) {
        const response = await axiosClient.get(`/trip-stations/${id}`);
        return response.data;
    },

    async createTripStation(data) {
        const response = await axiosClient.post("/trip-stations", data);
        return response.data;
    },

    async updateTripStation(id, data) {
        const response = await axiosClient.put(`/trip-stations/${id}`, data);
        return response.data;
    },

    async deleteTripStation(id) {
        const response = await axiosClient.delete(`/trip-stations/${id}`);
        return response.data;
    },
};

