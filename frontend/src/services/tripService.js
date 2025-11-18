import axiosClient from "../apis/axiosClient";

export const searchTripsApi = async (payload) => {
    try {
        const res = await axiosClient.post("/client/trips/search", payload);
        if (res.data?.success) {
            return { success: true, data: res.data.data };
        }

        return {
            success: false,
            message: res.data?.message || "Có lỗi xảy ra khi tìm chuyến",
        };
    } catch (error) {
        // Xử lý lỗi 404 (Không tìm thấy chuyến) hoặc lỗi mạng
        if (error.response) {
            const { status, data } = error.response;
            if (status === 404 && data?.message) {
                return { success: false, message: data.message };
            }
            return {
                success: false,
                message: data?.message || "Có lỗi xảy ra khi tìm chuyến",
            };
        }
        return { success: false, message: "Không thể kết nối tới máy chủ" };
    }
};
