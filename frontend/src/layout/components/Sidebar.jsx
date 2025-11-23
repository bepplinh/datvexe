import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { SIDEBAR_MENU } from "../data/sidebarMenuData";
import "../AdminLayout.scss";

function Sidebar({ sidebarOpen, mobileMenuOpen, onCloseMobileMenu, onLogout }) {
    const location = useLocation();
    const { admin } = useAdminAuth();

    return (
        <aside
            className={`admin-sidebar ${
                sidebarOpen ? "admin-sidebar--open" : "admin-sidebar--closed"
            } ${mobileMenuOpen ? "admin-sidebar--mobile-open" : ""}`}
        >
            <div className="admin-sidebar__header">
                <div className="admin-sidebar__logo">
                    <div className="admin-sidebar__logo-icon">🚌</div>
                    {sidebarOpen && (
                        <div className="admin-sidebar__logo-text">
                            <span className="admin-sidebar__logo-title">
                                Admin Panel
                            </span>
                            <span className="admin-sidebar__logo-subtitle">
                                Nhà xe Ngọc Sơn
                            </span>
                        </div>
                    )}
                </div>
                <button
                    className="admin-sidebar__close-btn"
                    onClick={onCloseMobileMenu}
                    aria-label="Đóng menu"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="admin-sidebar__nav">
                <ul className="admin-sidebar__nav-list">
                    {SIDEBAR_MENU.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <li
                                key={item.id}
                                className="admin-sidebar__nav-item"
                            >
                                <Link
                                    to={item.path}
                                    className={`admin-sidebar__nav-link ${
                                        isActive
                                            ? "admin-sidebar__nav-link--active"
                                            : ""
                                    }`}
                                    onClick={onCloseMobileMenu}
                                >
                                    <Icon
                                        size={20}
                                        className="admin-sidebar__nav-icon"
                                    />
                                    {sidebarOpen && (
                                        <span className="admin-sidebar__nav-label">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="admin-sidebar__footer">
                <div className="admin-sidebar__user">
                    <div className="admin-sidebar__user-avatar">
                        {admin?.avatarUrl ? (
                            <img
                                src={admin.avatarUrl}
                                alt={admin.name || "Avatar"}
                            />
                        ) : (
                            <span>
                                {(admin?.name || admin?.username || "A")
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="admin-sidebar__user-info">
                            <span className="admin-sidebar__user-name">
                                {admin?.name || admin?.username || "Admin"}
                            </span>
                            <span className="admin-sidebar__user-role">
                                Quản trị viên
                            </span>
                        </div>
                    )}
                </div>
                {sidebarOpen && (
                    <button
                        className="admin-sidebar__logout-btn"
                        onClick={onLogout}
                    >
                        Đăng xuất
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
