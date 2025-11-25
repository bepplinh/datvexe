import axiosClient from "../../apis/axiosClient";

export const adminLocationService = {
    async getLocations(params = {}) {
        const {
            search,
            type,
            parent_id,
            parent_type,
            per_page = 20,
            page = 1,
        } = params;
        const queryParams = new URLSearchParams({
            per_page: per_page.toString(),
            page: page.toString(),
        });

        if (search) {
            queryParams.append("search", search);
        }
        if (type) {
            queryParams.append("type", type);
        }
        if (parent_id) {
            queryParams.append("parent_id", parent_id);
        }
        if (parent_type) {
            queryParams.append("parent_type", parent_type);
        }

        const response = await axiosClient.get(
            `/locations?${queryParams.toString()}`
        );
        return response.data;
    },

    async getLocationById(id) {
        const response = await axiosClient.get(`/locations/${id}`);
        return response.data;
    },

    async createLocation(locationData) {
        const response = await axiosClient.post("/locations", locationData);
        return response.data;
    },

    async updateLocation(id, locationData) {
        const response = await axiosClient.put(
            `/locations/${id}`,
            locationData
        );
        return response.data;
    },

    async deleteLocation(id) {
        const response = await axiosClient.delete(`/locations/${id}`);
        return response.data;
    },

    // Lấy danh sách cities
    async getCities() {
        const response = await axiosClient.get("/location/cities");
        return response.data;
    },

    // Lấy danh sách districts theo city_id
    async getDistricts(cityId) {
        const response = await axiosClient.get("/districts", {
            params: { city_id: cityId },
        });
        return response.data;
    },

    // Lấy danh sách wards theo district_id
    async getWards(districtId) {
        const response = await axiosClient.get("/wards", {
            params: { district_id: districtId },
        });
        return response.data;
    },

    // Lấy cây địa điểm (tree structure)
    async getTreeStructure() {
        const response = await axiosClient.get("/locations-tree");
        return response.data;
    },
};
