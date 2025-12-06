// src/context/AuthProvider.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { authService } from "../services/authService";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(authService.getToken());
    const [loading, setLoading] = useState(true);
    const isMountedRef = useRef(true);
    const hasFetchedRef = useRef(false);
    const fetchingRef = useRef(false);

    // Kiểm tra xem có đang ở trang admin không (sử dụng window.location vì Provider nằm ngoài Router)
    const isAdminRoute =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin");

    const handleLogout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setAccessToken(null);
        toast.success("Đăng xuất thành công");
        setTimeout(() => {
            window.location.href = "/";
        }, 500);
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Lắng nghe thay đổi route để reset flag khi cần
    useEffect(() => {
        const checkRoute = () => {
            const currentPath =
                typeof window !== "undefined" ? window.location.pathname : "";
            const isAdmin = currentPath.startsWith("/admin");

            // Nếu chuyển từ client sang admin hoặc ngược lại, reset flag
            if (isAdmin !== isAdminRoute) {
                hasFetchedRef.current = false;
            }
        };

        // Kiểm tra route khi mount
        checkRoute();

        // Lắng nghe popstate event (back/forward button)
        window.addEventListener("popstate", checkRoute);

        return () => {
            window.removeEventListener("popstate", checkRoute);
        };
    }, [isAdminRoute]);

    useEffect(() => {
        const fetchUser = async () => {
            // Kiểm tra route hiện tại
            const currentPath =
                typeof window !== "undefined" ? window.location.pathname : "";
            const isAdmin = currentPath.startsWith("/admin");

            // Không gọi API nếu đang ở trang admin
            if (isAdmin) {
                if (isMountedRef.current) {
                    setLoading(false);
                }
                return;
            }

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
                const data = await authService.getCurrentUser();
                if (isMountedRef.current) {
                    setUser(data);
                }
            } catch (err) {
                console.error("Failed to fetch current user:", err);
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
        fetchUser();
    }, [accessToken, handleLogout]);

    const handleLogin = async (credentials) => {
        const { user, token } = await authService.login(credentials);
        hasFetchedRef.current = false; // Reset để có thể fetch lại
        setUser(user);
        setAccessToken(token);
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
