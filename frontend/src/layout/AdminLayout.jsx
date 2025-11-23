import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./AdminLayout.scss";

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { logout } = useAdminAuth();

    // Đóng mobile menu khi resize về desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen((prev) => !prev);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                mobileMenuOpen={mobileMenuOpen}
                onCloseMobileMenu={closeMobileMenu}
                onLogout={logout}
            />

            {/* Overlay cho mobile */}
            {mobileMenuOpen && (
                <div
                    className="admin-sidebar__overlay"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Main Content */}
            <div
                className={`admin-main ${
                    sidebarOpen
                        ? "admin-main--sidebar-open"
                        : "admin-main--sidebar-closed"
                }`}
            >
                {/* Header */}
                <Header
                    onToggleSidebar={toggleSidebar}
                    onToggleMobileMenu={toggleMobileMenu}
                />

                {/* Page Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
