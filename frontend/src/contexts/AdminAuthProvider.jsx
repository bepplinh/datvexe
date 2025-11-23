import { createContext, useEffect, useState } from "react";
import { adminAuthService } from "../services/adminAuthService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [accessToken, setAccessToken] = useState(adminAuthService.getToken());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdmin = async () => {
            if (!accessToken) {
                setLoading(false);
                return;
            }
            try {
                const data = await adminAuthService.getCurrentUser();
                setAdmin(data);
            } catch (err) {
                console.error("Failed to fetch admin user:", err);
                await handleLogout();
            } finally {
                setLoading(false);
            }
        };
        fetchAdmin();
    }, [accessToken]);

    const handleLogin = async (credentials) => {
        try {
            const { user, token } = await adminAuthService.login(credentials);
            setAdmin(user);
            setAccessToken(token);
            toast.success("Đăng nhập thành công!");
        } catch (err) {
            toast.error(err.message || "Đăng nhập thất bại");
            throw err;
        }
    };

    const handleLogout = async () => {
        await adminAuthService.logout();
        setAdmin(null);
        setAccessToken(null);
        toast.success("Đăng xuất thành công");
        navigate("/admin/login");
    };

    return (
        <AdminAuthContext.Provider
            value={{
                admin,
                accessToken,
                loading,
                login: handleLogin,
                logout: handleLogout,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
};
