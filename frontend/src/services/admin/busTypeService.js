import axiosClient from "../../apis/axiosClient";

export const adminBusTypeService = {
    async getBusTypes() {
        const response = await axiosClient.get("/type_buses");
        return response.data;
    },

    async getBusTypeById(id) {
        const response = await axiosClient.get(`/type_buses/${id}`);
        return response.data;
    },

    async createBusType(busTypeData) {
        const response = await axiosClient.post("/type_buses", busTypeData);
        return response.data;
    },

    async updateBusType(id, busTypeData) {
        const response = await axiosClient.put(`/type_buses/${id}`, busTypeData);
        return response.data;
    },

    async deleteBusType(id) {
        const response = await axiosClient.delete(`/type_buses/${id}`);
        return response.data;
    },
};

