import axiosClient from "../apis/axiosClient";


class LocationService {
  async getCities() {
    try {
      const res = await axiosClient.get("/client/locations");
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw new Error("Không thể tải danh sách địa điểm");
    }
  }

  async searchLocations(keyword) {
    try {
      const res = await axiosClient.get("/client/locations/search", {
        params: { q: keyword },
      });
      return res.data?.data || [];
    } catch (error) {
      console.error("Error searching locations:", error);
      throw new Error("Không thể tìm kiếm địa điểm");
    }
  }

  async getChildren(parentId, parentType) {
    try {
      const res = await axiosClient.get("/locations", {
        params: { parent_id: parentId, parent_type: parentType },
      });
      return res.data?.data || [];
    } catch (error) {
      console.error("Error fetching children:", error);
      throw new Error("Không thể tải danh sách con");
    }
  }
}

export default new LocationService();

