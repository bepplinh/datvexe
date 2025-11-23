import { AdminAuthContext } from "../contexts/AdminAuthProvider";
import { useContext } from "react";

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error("useAdminAuth must be used within AdminAuthProvider");
    }
    return context;
};
