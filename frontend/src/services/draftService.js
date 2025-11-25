import axiosClient from "../apis/axiosClient";
import Cookies from "js-cookie";

export const getDraftById = async (draftId) => {
    try {
        const sessionToken = Cookies.get("x_session_token");
        const res = await axiosClient.get(`/checkout/drafts/${draftId}`);

        return {
            success: true,
            data: res.data,
        };
    } catch (error) {
        // ✅ Debug error
        console.error("❌ Error GET Draft:", error.response);
        if (error.response) {
            const { status, data } = error.response;
            return {
                success: false,
                message:
                    data?.message || "Không thể tải thông tin đơn giữ chỗ.",
                status,
            };
        }
        return {
            success: false,
            message: "Đã có lỗi xảy ra ! Vui lòng thử lại.",
        };
    }
};

export const updateDraftPayment = async (draftId, payload) => {
    try {
        const res = await axiosClient.put(
            `/drafts/${draftId}/payment`,
            payload
        );
        return {
            success: true,
            data: res.data,
        };
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            return {
                success: false,
                message:
                    data?.message || "Không thể cập nhật thông tin thanh toán.",
                status,
            };
        }
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ",
        };
    }
};

export const unlockSeats = async () => {
    try {
        const sessionToken = Cookies.get("x_session_token");
        if (!sessionToken) {
            return {
                success: false,
                message: "Không tìm thấy session token",
            };
        }

        const res = await axiosClient.post("/checkout/unlock-seats", null, {
            headers: {
                "X-Session-Token": sessionToken,
            },
        });

        return {
            success: true,
            data: res.data,
        };
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            return {
                success: false,
                message:
                    data?.message || "Không thể giải phóng ghế. Vui lòng thử lại.",
                status,
            };
        }
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ",
        };
    }
};