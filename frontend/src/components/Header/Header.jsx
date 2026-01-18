import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUserNotifications } from "../../contexts/UserNotificationProvider";
import UserNotificationBell from "../UserNotificationBell";
import "./Header.scss";
import PHONE_ICON from "../../assets/phone_icon.png";

const LOGO_ICON =
    "https://www.figma.com/api/mcp/asset/885b2f28-16b0-4479-a9e2-128157e7226f";

const NAV_ITEMS = [
    { label: "Trang chủ", href: "#" },
    { label: "Giới thiệu", href: "#" },
    { label: "Tin tức", href: "#" },
    { label: "Liên hệ", href: "#" },
];

export default function Header() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const profileRef = useRef(null);

    const toggleMobileMenu = () => setIsMobileOpen((prev) => !prev);
    const closeMobileMenu = () => setIsMobileOpen(false);
    const closeProfileMenu = () => setIsProfileMenuOpen(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop =
                window.scrollY || document.documentElement.scrollTop;
            setIsScrolled(scrollTop > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleNavigateToProfile = () => {
        closeMobileMenu();
        closeProfileMenu();
        navigate("/profile");
    };

    const handleLogout = () => {
        logout();
        closeMobileMenu();
        closeProfileMenu();
    };

    const renderAvatarContent = () => {
        if (user?.avatarUrl) {
            return <img src={user.avatarUrl} alt={user.name || "Avatar"} />;
        }

        const displayName = user?.name || user?.username || "";
        const initials =
            displayName
                .trim()
                .split(" ")
                .map((part) => part.charAt(0).toUpperCase())
                .filter(Boolean)
                .slice(0, 2)
                .join("") || "U";

        return <span>{initials}</span>;
    };

    const renderHotlineAndAuth = () => (
        <div className="site-header__right-inner">
            <div className="site-header__hotline">
                <div className="site-header__hotline-icon">
                    <img src={PHONE_ICON} alt="Hotline" />
                </div>
                <div className="site-header__hotline-text">
                    <span className="site-header__hotline-label">
                        Tổng đài đặt vé
                    </span>
                    <span className="site-header__hotline-number">
                        02373833552
                    </span>
                </div>
            </div>

            {/* Notification Bell for logged-in users */}
            {user && <UserNotificationBell />}

            {user ? (
                <div
                    className={`site-header__profile ${isProfileMenuOpen ? "site-header__profile--open" : ""
                        }`}
                    ref={profileRef}
                >
                    <button
                        type="button"
                        className="site-header__profile-trigger"
                        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                        aria-haspopup="true"
                        aria-expanded={isProfileMenuOpen}
                    >
                        <div className="site-header__profile-avatar">
                            {renderAvatarContent()}
                        </div>
                        <div className="site-header__profile-info">
                            <span className="site-header__profile-name">
                                {user.name || user.username}
                            </span>
                        </div>
                        <span className="site-header__profile-arrow" />
                    </button>
                    <div className="site-header__profile-menu">
                        <button
                            type="button"
                            className="site-header__profile-menu-item"
                            onClick={() => {
                                closeMobileMenu();
                                closeProfileMenu();
                                navigate("/tickets");
                            }}
                        >
                            Vé của tôi
                        </button>
                        <button
                            type="button"
                            className="site-header__profile-menu-item"
                            onClick={handleNavigateToProfile}
                        >
                            Chỉnh sửa thông tin
                        </button>
                        <button
                            type="button"
                            className="site-header__profile-menu-item site-header__profile-menu-item--danger"
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    className="site-header__login-btn"
                    onClick={() => {
                        closeMobileMenu();
                        navigate("/login");
                    }}
                >
                    Đăng nhập
                </button>
            )}
        </div>
    );

    return (
        <header
            className={`site-header ${isScrolled ? "site-header--scrolled" : ""
                }`}
        >
            <div className="site-header__inner">
                <Link
                    to="/"
                    className="site-header__logo"
                    onClick={closeMobileMenu}
                >
                    <div className="site-header__logo-text">
                        <span className="site-header__logo-line site-header__logo-line--top">
                            DucAnh
                        </span>
                        <span className="site-header__logo-line site-header__logo-line--bottom">
                            Transport
                        </span>
                    </div>
                </Link>

                {/* Nút hamburger (mobile) */}
                <button
                    type="button"
                    className={`site-header__toggle ${isMobileOpen ? "site-header__toggle--active" : ""
                        }`}
                    onClick={toggleMobileMenu}
                    aria-label="Mở/đóng menu"
                    aria-expanded={isMobileOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>

                {/* Navigation */}
                <nav
                    className={`site-header__nav ${isMobileOpen ? "site-header__nav--open" : ""
                        }`}
                >
                    <ul className="site-header__nav-list">
                        {NAV_ITEMS.map((item) => (
                            <li
                                key={item.label}
                                className="site-header__nav-item"
                            >
                                <a
                                    href={item.href}
                                    className={`site-header__nav-link ${item.label === "Trang chủ"
                                        ? "site-header__nav-link--active"
                                        : ""
                                        }`}
                                    onClick={closeMobileMenu}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* Hotline + Đăng nhập trong dropdown mobile */}
                    <div className="site-header__mobile-extra">
                        {renderHotlineAndAuth()}
                    </div>
                </nav>

                {/* Hotline + Đăng nhập (desktop) */}
                <div className="site-header__right">
                    {renderHotlineAndAuth()}
                </div>
            </div>
        </header>
    );
}
