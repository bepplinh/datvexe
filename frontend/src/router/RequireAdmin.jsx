import { useAuth } from "./../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import CircularIndeterminate from "../components/Loading/Loading";

function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <CircularIndeterminate />;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.role !== "admin") {
        toast.warning("Bạn không có quyền truy cập !", {
            toastId: "no-permission",
        });
        return <Navigate to="/" replace />;
    }
    return children;
}

export default RequireAdmin;
