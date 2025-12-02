import { useAdminAuth } from "./../hooks/useAdminAuth";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import CircularIndeterminate from "../components/Loading/Loading";

function RequireAdmin({ children }) {
    const { admin, loading } = useAdminAuth();
    const location = useLocation();

    if (loading) return <CircularIndeterminate />;

    if (!admin) {
        return (
            <Navigate
                to="/admin/login"
                state={{ from: location }}
                replace
            />
        );
    }

    if (admin.role !== "admin") {
        toast.warning("Bạn không có quyền truy cập !", {
            toastId: "no-permission",
        });
        return <Navigate to="/" replace />;
    }
    return children;
}

export default RequireAdmin;
