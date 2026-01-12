import axiosClient from "../apis/axiosClient";
import Cookies from "js-cookie";

export const getDraftById = async (draftId) => {
    try {
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

            // Xử lý các trường hợp lỗi cụ thể
            let errorMessage =
                (data && data.message) ||
                "Không thể tải thông tin đơn giữ chỗ.";

            if (status === 403) {
                // Không có quyền truy cập
                errorMessage =
                    (data && data.message) ||
                    "Bạn không có quyền truy cập đơn đặt vé này. Vui lòng tạo đơn mới.";
            } else if (status === 404) {
                // Draft không tồn tại
                errorMessage =
                    (data && data.message) ||
                    "Đơn đặt vé không tồn tại hoặc đã hết hạn.";
            } else if (status === 422) {
                // Draft đã hết hiệu lực
                errorMessage =
                    (data && data.message) ||
                    "Đơn đặt vé này đã hết hiệu lực hoặc đã được xử lý.";
            } else if (status === 429) {
                // Rate limit
                errorMessage =
                    "Bạn đã truy cập quá nhiều lần. Vui lòng đợi một chút rồi thử lại.";
            }

            return {
                success: false,
                message: errorMessage,
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
                    (data && data.message) ||
                    "Không thể cập nhật thông tin thanh toán.",
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
                    (data && data.message) ||
                    "Không thể giải phóng ghế. Vui lòng thử lại.",
                status,
            };
        }
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ",
        };
    }
};

export const checkPendingDraft = async () => {
    try {
        const sessionToken = Cookies.get("x_session_token");
        if (!sessionToken) {
            return { success: true, pendingDraft: null };
        }

        const res = await axiosClient.get("/checkout/pending-draft", {
            headers: {
                "X-Session-Token": sessionToken,
            },
        });

        return {
            success: true,
            pendingDraft: res.data.pending_draft || null,
        };
    } catch (error) {
        console.error("Check pending draft error:", error);
        return {
            success: false,
            pendingDraft: null,
            message: "Không thể kiểm tra đơn đặt vé đang chờ.",
        };
    }
};
