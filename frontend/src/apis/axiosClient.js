import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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

        // ❌ Nếu không có token (người dùng chưa đăng nhập) thì không refresh
        const token = Cookies.get("access_token");
        if (!token) {
            return Promise.reject(error);
        }

        // Nếu đã retry 1 lần mà vẫn 401 → coi như token hỏng, logout
        if (originalRequest._retry) {
            Cookies.remove("access_token");
            window.location.href = "/login";
            return Promise.reject(error);
        }

        // ✅ Thử refresh 1 lần
        originalRequest._retry = true;

        try {
            const res = await refreshClient.post("/refresh");
            const newAccessToken = res.data?.access_token;

            if (newAccessToken) {
                Cookies.set("access_token", newAccessToken, {
                    sameSite: "Strict",
                });

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Gọi lại request gốc với token mới
                return axiosClient(originalRequest);
            }
        } catch (refreshError) {
            // Refresh fail → xoá token, đưa về trang login
            Cookies.remove("access_token");
            window.location.href = "/login";
            return Promise.reject(refreshError);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
