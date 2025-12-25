import axiosClient from "../../apis/axiosClient";

export const adminTripService = {
    async getTrips(params = {}) {
        const {
            route_id,
            status,
            bus_id,
            date_from,
            date_to,
            from_city,
            to_city,
            direction,
            route_pair,
            per_page,
            page,
        } = params;

        const queryParams = new URLSearchParams();

        if (per_page) queryParams.append("per_page", String(per_page));
        if (page) queryParams.append("page", String(page));
        if (route_id) queryParams.append("route_id", route_id);
        if (status) queryParams.append("status", status);
        if (bus_id) queryParams.append("bus_id", bus_id);
        if (date_from) queryParams.append("date_from", date_from);
        if (date_to) queryParams.append("date_to", date_to);
        if (from_city) queryParams.append("from_city", from_city);
        if (to_city) queryParams.append("to_city", to_city);
        if (direction) queryParams.append("direction", direction);
        if (route_pair) queryParams.append("route_pair", route_pair);

        const queryString = queryParams.toString();
        const url = queryString ? `/trips?${queryString}` : "/trips";
        const response = await axiosClient.get(url);
        return response.data;
    },

    async getTripById(id) {
        const response = await axiosClient.get(`/trips/${id}`);
        return response.data;
    },

    async createTrip(data) {
        const response = await axiosClient.post("/trips", data);
        return response.data;
    },

    async updateTrip(id, data) {
        const response = await axiosClient.put(`/trips/${id}`, data);
        return response.data;
    },

    async deleteTrip(id) {
        const response = await axiosClient.delete(`/trips/${id}`);
        return response.data;
    },

    async getTripSeats(tripId) {
        const response = await axiosClient.get(`/admin/trips/${tripId}/seats`);
        return response.data;
    },
};
