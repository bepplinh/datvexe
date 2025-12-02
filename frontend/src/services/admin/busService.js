import axiosClient from "../../apis/axiosClient";

export const adminBusService = {
    async getBuses(params = {}) {
        const {
            search,
            type_bus_id,
            per_page = 10,
            page = 1,
        } = params;
        const queryParams = new URLSearchParams({
            per_page: per_page.toString(),
            page: page.toString(),
        });

        if (search) {
            queryParams.append("search", search);
        }
        if (type_bus_id) {
            queryParams.append("type_bus_id", type_bus_id);
        }

        const response = await axiosClient.get(
            `/buses?${queryParams.toString()}`
        );
        return response.data;
    },

    async getBusById(id) {
        const response = await axiosClient.get(`/buses/${id}`);
        return response.data;
    },

    async createBus(busData) {
        const response = await axiosClient.post("/buses", busData);
        return response.data;
    },

    async updateBus(id, busData) {
        const response = await axiosClient.put(`/buses/${id}`, busData);
        return response.data;
    },

    async deleteBus(id) {
        const response = await axiosClient.delete(`/buses/${id}`);
        return response.data;
    },
};

