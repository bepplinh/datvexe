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
      // API returns { success: true, data: [...] }
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error searching locations:", error);
      throw new Error("Không thể tìm kiếm địa điểm");
    }
  }
}

export default new LocationService();

