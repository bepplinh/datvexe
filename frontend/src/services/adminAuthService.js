import apiClient from "../apis/axiosClient";
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";

export const adminAuthService = {
    async login({ identifier, password, rememberMe = true }) {
        const res = await apiClient.post("/login", {
            identifier,
            password,
            remember_me: rememberMe,
        });

        const { access_token, user } = res.data;

        // Kiểm tra role admin
        if (user?.role !== "admin") {
            throw new Error("Bạn không có quyền truy cập admin.");
        }

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
            console.error("Server logout failed:", err);
        }

        Cookies.remove(TOKEN_KEY);
        delete apiClient.defaults.headers.common["Authorization"];
    },

    async getCurrentUser() {
        const token = Cookies.get(TOKEN_KEY);
        if (!token) throw new Error("No token found");

        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const res = await apiClient.get("/me");
        const user = res.data;

        // Kiểm tra role admin
        if (user?.role !== "admin") {
            throw new Error("Bạn không có quyền truy cập admin.");
        }

        return user;
    },

    getToken() {
        return Cookies.get(TOKEN_KEY) || null;
    },
};
