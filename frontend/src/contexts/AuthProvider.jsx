// src/context/AuthProvider.jsx
import { createContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(authService.getToken());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (!accessToken) {
                setLoading(false);
                return;
            }
            try {
                const data = await authService.getCurrentUser();
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch current user:", err);
                await handleLogout();
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [accessToken]);

    const handleLogin = async (credentials) => {
        const { user, token } = await authService.login(credentials);
        setUser(user);
        setAccessToken(token);
    };

    const handleLogout = async () => {
        await authService.logout();
        setUser(null);
        setAccessToken(null);
        toast.success("Đăng xuất thành công");
        setTimeout(() => {
            window.location.href = "/";
        }, 500);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                loading,
                login: handleLogin,
                logout: handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
