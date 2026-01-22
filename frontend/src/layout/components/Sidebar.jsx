import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, LayoutDashboard, ChevronDown, ChevronRight } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { SIDEBAR_MENU } from "../data/sidebarMenuData";
import "../AdminLayout.scss";

function Sidebar({ sidebarOpen, mobileMenuOpen, onCloseMobileMenu, onLogout }) {
    const location = useLocation();
    const { admin } = useAdminAuth();
    const [expandedMenus, setExpandedMenus] = useState(() => {
        // Auto-expand menu if it has active child
        const initial = {};
        SIDEBAR_MENU.forEach((item) => {
            if (item.children) {
                const hasActive = item.children.some(
                    (child) => location.pathname === child.path
                );
                if (hasActive) {
                    initial[item.id] = true;
                }
            }
        });
        return initial;
    });

    const toggleMenu = (menuId) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [menuId]: !prev[menuId],
        }));
    };

    const isMenuExpanded = (menuId) => expandedMenus[menuId] || false;
    const hasActiveChild = (item) => {
        if (!item.children) return false;
        return item.children.some((child) => location.pathname === child.path);
    };

    return (
        <aside
            className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : "admin-sidebar--closed"
                } ${mobileMenuOpen ? "admin-sidebar--mobile-open" : ""}`}
        >
            <div className="admin-sidebar__header">
                <div className="admin-sidebar__logo">
                    <div className="admin-sidebar__logo-icon">
                        <LayoutDashboard size={20} />
                    </div>
                    {sidebarOpen && (
                        <div className="admin-sidebar__logo-text">
                            <span className="admin-sidebar__logo-title">
                                Admin Panel
                            </span>
                            <span className="admin-sidebar__logo-subtitle">
                                DucAnh Transport
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
                        // Skip divider items
                        if (item.divider) {
                            return (
                                <li
                                    key={item.id}
                                    className="admin-sidebar__divider"
                                >
                                    {sidebarOpen && item.label !== "---" && (
                                        <span className="admin-sidebar__divider-text">
                                            {item.label}
                                        </span>
                                    )}
                                </li>
                            );
                        }

                        // Menu with children (submenu)
                        if (item.children && item.children.length > 0) {
                            const Icon = item.icon;
                            const isExpanded = isMenuExpanded(item.id);
                            const hasActive = hasActiveChild(item);

                            return (
                                <li
                                    key={item.id}
                                    className={`admin-sidebar__nav-item admin-sidebar__nav-item--parent ${hasActive ? "admin-sidebar__nav-item--has-active" : ""
                                        }`}
                                >
                                    <button
                                        className={`admin-sidebar__nav-link admin-sidebar__nav-link--parent ${hasActive ? "admin-sidebar__nav-link--active" : ""
                                            }`}
                                        onClick={() => toggleMenu(item.id)}
                                    >
                                        <Icon
                                            size={20}
                                            className="admin-sidebar__nav-icon"
                                        />
                                        {sidebarOpen && (
                                            <>
                                                <span className="admin-sidebar__nav-label">
                                                    {item.label}
                                                </span>
                                                <ChevronDown
                                                    size={16}
                                                    className={`admin-sidebar__nav-chevron ${isExpanded
                                                        ? "admin-sidebar__nav-chevron--expanded"
                                                        : "admin-sidebar__nav-chevron--collapsed"
                                                        }`}
                                                />
                                            </>
                                        )}
                                    </button>
                                    <ul
                                        className={`admin-sidebar__submenu ${isExpanded && sidebarOpen
                                            ? "admin-sidebar__submenu--expanded"
                                            : "admin-sidebar__submenu--collapsed"
                                            }`}
                                    >
                                        {item.children.map((child) => {
                                            const ChildIcon = child.icon;
                                            const isChildActive =
                                                location.pathname === child.path;
                                            return (
                                                <li
                                                    key={child.id}
                                                    className="admin-sidebar__submenu-item"
                                                >
                                                    <Link
                                                        to={child.path}
                                                        className={`admin-sidebar__submenu-link ${isChildActive
                                                            ? "admin-sidebar__submenu-link--active"
                                                            : ""
                                                            }`}
                                                        onClick={onCloseMobileMenu}
                                                    >
                                                        <ChildIcon
                                                            size={18}
                                                            className="admin-sidebar__submenu-icon"
                                                        />
                                                        <span className="admin-sidebar__submenu-label">
                                                            {child.label}
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            );
                        }

                        // Regular menu item
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <li
                                key={item.id}
                                className="admin-sidebar__nav-item"
                            >
                                <Link
                                    to={item.path}
                                    className={`admin-sidebar__nav-link ${isActive
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
