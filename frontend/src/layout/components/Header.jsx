import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronRight, Home, Bell } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { SIDEBAR_MENU } from "../data/sidebarMenuData";
import "../AdminLayout.scss";

function Header({ onToggleSidebar, onToggleMobileMenu }) {
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [unreadCount] = useState(5); // Số thông báo chưa đọc
    const location = useLocation();
    const { admin } = useAdminAuth();

    // Đóng notification dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                notificationOpen &&
                !event.target.closest(".admin-header__notifications")
            ) {
                setNotificationOpen(false);
            }
        };

        if (notificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationOpen]);

    // Tạo breadcrumb từ path
    const generateBreadcrumbs = () => {
        const paths = location.pathname.split("/").filter(Boolean);
        const breadcrumbs = [{ label: "Trang chủ", path: "/" }];

        if (paths.length > 0 && paths[0] === "admin") {
            breadcrumbs.push({ label: "Admin", path: "/admin" });

            const currentMenuItem = SIDEBAR_MENU.find(
                (item) => item.path === location.pathname
            );

            if (currentMenuItem && location.pathname !== "/admin") {
                breadcrumbs.push({
                    label: currentMenuItem.label,
                    path: location.pathname,
                });
            }
        }

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <header className="admin-header">
            <div className="admin-header__left">
                <button
                    className="admin-header__menu-btn"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </button>
                <button
                    className="admin-header__mobile-menu-btn"
                    onClick={onToggleMobileMenu}
                    aria-label="Mở menu"
                >
                    <Menu size={24} />
                </button>
            </div>

            <div className="admin-header__center">
                <nav
                    className="admin-breadcrumb"
                    aria-label="Breadcrumb"
                >
                    <ol className="admin-breadcrumb__list">
                        {breadcrumbs.map((crumb, index) => {
                            const isLast =
                                index === breadcrumbs.length - 1;
                            return (
                                <li
                                    key={crumb.path}
                                    className="admin-breadcrumb__item"
                                >
                                    {isLast ? (
                                        <span className="admin-breadcrumb__current">
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <>
                                            <Link
                                                to={crumb.path}
                                                className="admin-breadcrumb__link"
                                            >
                                                {index === 0 ? (
                                                    <Home size={16} />
                                                ) : (
                                                    crumb.label
                                                )}
                                            </Link>
                                            <ChevronRight
                                                size={16}
                                                className="admin-breadcrumb__separator"
                                            />
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            <div className="admin-header__right">
                {/* Notification Bell */}
                <div className="admin-header__notifications">
                    <button
                        className="admin-header__notification-btn"
                        onClick={() =>
                            setNotificationOpen(!notificationOpen)
                        }
                        aria-label="Thông báo"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="admin-header__notification-badge">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {notificationOpen && (
                        <div className="admin-header__notification-dropdown">
                            <div className="admin-header__notification-header">
                                <h3>Thông báo</h3>
                                {unreadCount > 0 && (
                                    <button className="admin-header__notification-mark-all">
                                        Đánh dấu đã đọc tất cả
                                    </button>
                                )}
                            </div>
                            <div className="admin-header__notification-list">
                                <div className="admin-header__notification-item admin-header__notification-item--unread">
                                    <div className="admin-header__notification-dot"></div>
                                    <div className="admin-header__notification-content">
                                        <div className="admin-header__notification-title">
                                            Đơn hàng mới
                                        </div>
                                        <div className="admin-header__notification-message">
                                            Có đơn hàng mới #12345 cần xử lý
                                        </div>
                                        <div className="admin-header__notification-time">
                                            5 phút trước
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-header__notification-item admin-header__notification-item--unread">
                                    <div className="admin-header__notification-dot"></div>
                                    <div className="admin-header__notification-content">
                                        <div className="admin-header__notification-title">
                                            Thanh toán thành công
                                        </div>
                                        <div className="admin-header__notification-message">
                                            Đơn hàng #12344 đã thanh toán thành công
                                        </div>
                                        <div className="admin-header__notification-time">
                                            15 phút trước
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-header__notification-item">
                                    <div className="admin-header__notification-content">
                                        <div className="admin-header__notification-title">
                                            Chuyến xe sắp khởi hành
                                        </div>
                                        <div className="admin-header__notification-message">
                                            Chuyến xe #789 sẽ khởi hành trong 1 giờ
                                        </div>
                                        <div className="admin-header__notification-time">
                                            1 giờ trước
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-header__notification-footer">
                                <button className="admin-header__notification-view-all">
                                    Xem tất cả thông báo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="admin-header__user">
                    <div className="admin-header__user-avatar">
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
                    <div className="admin-header__user-info">
                        <span className="admin-header__user-name">
                            {admin?.name || admin?.username || "Admin"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

