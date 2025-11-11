// src/services/authService.js
import apiClient from "../apis/axiosClient";
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";

export const authService = {
    async login({ identifier, password, rememberMe }) {
        const res = await apiClient.post("/login", {
            identifier,
            password,
            remember_me: rememberMe,
        });

        const { access_token, user } = res.data;

        Cookies.set(TOKEN_KEY, access_token, {
            expires: rememberMe ? 7 : null,
        });

        apiClient.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${access_token}`;

        return { user, token: access_token };
    },

    async logout() {
        try {
            await apiClient.post("/logout");
        } catch (err) {
            toast.error("Server logout failed, doing client cleanup");
        }

        Cookies.remove(TOKEN_KEY);
        delete apiClient.defaults.headers.common["Authorization"];
    },

    // ✅ Lấy user hiện tại (dùng khi reload)
    async getCurrentUser() {
        const token = Cookies.get(TOKEN_KEY);
        if (!token) throw new Error("No token found");

        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const res = await apiClient.get("/me");
        return res.data;
    },

    // ✅ Lấy token nhanh gọn cho AuthProvider
    getToken() {
        return Cookies.get(TOKEN_KEY) || null;
    },
};
