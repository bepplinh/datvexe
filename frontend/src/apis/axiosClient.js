import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const API_BASE_URL =
    import.meta.env.VITE_API_URL;

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// 👉 Instance riêng cho /refresh, KHÔNG có interceptor
const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // ✅ Thêm X-Session-Token từ cookie (thống nhất với backend: x_session_token)
        const sessionToken = Cookies.get("x_session_token");
        if (sessionToken) {
            config.headers["X-Session-Token"] = sessionToken;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        const status = error.response.status;
        const url = originalRequest.url || "";

        // ❌ Không can thiệp refresh cho các lỗi KHÔNG phải 401
        if (status !== 401) {
            return Promise.reject(error);
        }

        // ❌ Không refresh cho chính request /login hoặc /refresh
        if (url.includes("/login") || url.includes("/refresh")) {
            return Promise.reject(error); // để component (Login.jsx) tự xử lý
        }

        // ❌ Nếu không có token (người dùng chưa đăng nhập) thì hiển thị thông báo và redirect về login
        const token = Cookies.get("access_token");
        if (!token) {
            // Hiển thị toast thân thiện cho người dùng chưa đăng nhập
            // Chỉ hiển thị 1 lần để tránh spam toast
            const currentPath = window.location.pathname;
            if (
                !originalRequest._hasShownAuthToast &&
                !currentPath.includes("/login")
            ) {
                originalRequest._hasShownAuthToast = true;
                toast.error("Vui lòng đăng nhập để sử dụng chức năng này");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 1500);
            }
            return Promise.reject(error);
        }

        // Nếu đã retry 1 lần mà vẫn 401 → coi như token hỏng, logout
        if (originalRequest._retry) {
            Cookies.remove("access_token");
            // Chỉ hiển thị toast nếu không đang ở trang login
            const currentPath = window.location.pathname;
            if (!currentPath.includes("/login")) {
                toast.error(
                    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại"
                );
            }
            setTimeout(() => {
                window.location.href = "/login";
            }, 1000);
            return Promise.reject(error);
        }

        // ✅ Thử refresh 1 lần
        originalRequest._retry = true;

        try {
            const res = await refreshClient.post("/refresh");
            const newAccessToken = res.data.access_token;

            if (newAccessToken) {
                Cookies.set("access_token", newAccessToken, {
                    sameSite: "Strict",
                });

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Gọi lại request gốc với token mới
                return axiosClient(originalRequest);
            }
        } catch (refreshError) {
            // Refresh fail → xoá token, hiển thị thông báo và đưa về trang login
            Cookies.remove("access_token");
            // Chỉ hiển thị toast nếu không đang ở trang login
            const currentPath = window.location.pathname;
            if (!currentPath.includes("/login")) {
                toast.error(
                    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại"
                );
            }
            setTimeout(() => {
                window.location.href = "/login";
            }, 1000);
            return Promise.reject(refreshError);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
