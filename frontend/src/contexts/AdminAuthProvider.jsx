import { createContext, useEffect, useState, useRef, useCallback } from "react";
import { adminAuthService } from "../services/adminAuthService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [accessToken, setAccessToken] = useState(adminAuthService.getToken());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const isMountedRef = useRef(true);
    const hasFetchedRef = useRef(false);
    const fetchingRef = useRef(false);

    const handleLogout = useCallback(async () => {
        await adminAuthService.logout();
        setAdmin(null);
        setAccessToken(null);
        toast.success("Đăng xuất thành công");
        navigate("/admin/login");
    }, [navigate]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const fetchAdmin = async () => {
            if (!accessToken) {
                if (isMountedRef.current) {
                    setLoading(false);
                }
                hasFetchedRef.current = false;
                return;
            }

            // Tránh gọi API nhiều lần cùng lúc
            if (fetchingRef.current || hasFetchedRef.current) {
                return;
            }

            fetchingRef.current = true;
            hasFetchedRef.current = true;

            try {
                const data = await adminAuthService.getCurrentUser();
                if (isMountedRef.current) {
                    setAdmin(data);
                }
            } catch (err) {
                console.error("Failed to fetch admin user:", err);
                hasFetchedRef.current = false;
                if (isMountedRef.current) {
                    await handleLogout();
                }
            } finally {
                fetchingRef.current = false;
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };
        fetchAdmin();
    }, [accessToken, handleLogout]);

    const handleLogin = async (credentials) => {
        try {
            const { user, token } = await adminAuthService.login(credentials);
            hasFetchedRef.current = false; // Reset để có thể fetch lại
            setAdmin(user);
            setAccessToken(token);
            toast.success("Đăng nhập thành công!");
        } catch (err) {
            toast.error(err.message || "Đăng nhập thất bại");
            throw err;
        }
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
