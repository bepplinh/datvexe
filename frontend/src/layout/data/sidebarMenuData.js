import {
    LayoutDashboard,
    Users,
    Ticket,
    Bus,
    Settings,
    MapPin,
    Route,
    Rows3,
    Sparkles,
    Car,
    MessageCircle,
} from "lucide-react";

export const SIDEBAR_MENU = [
    {
        id: "dashboard",
        label: "Tổng quan",
        icon: LayoutDashboard,
        path: "/admin",
    },
    {
        id: "users",
        label: "Quản lý người dùng",
        icon: Users,
        path: "/admin/users",
    },
    {
        id: "tickets",
        label: "Quản lý vé",
        icon: Ticket,
        path: "/admin/tickets",
    },
    {
        id: "trips",
        label: "Quản lý chuyến xe",
        icon: Bus,
        path: "/admin/trips",
    },
    {
        id: "locations",
        label: "Quản lý địa điểm",
        icon: MapPin,
        path: "/admin/locations",
    },
    {
        id: "routes",
        label: "Quản lý tuyến",
        icon: Route,
        path: "/admin/routes",
    },
    {
        id: "buses",
        label: "Quản lý xe",
        icon: Bus,
        path: "/admin/buses",
    },
    {
        id: "route-optimization",
        label: "Tối ưu tuyến AI",
        icon: Sparkles,
        path: "/admin/route-optimization",
    },
    {
        id: "seat-layout",
        label: "Sơ đồ ghế",
        icon: Rows3,
        path: "/admin/seat-layout",
    },
    {
        id: "support-chat",
        label: "Hỗ trợ khách hàng",
        icon: MessageCircle,
        path: "/admin/support-chat",
    },
    {
        id: "settings",
        label: "Cài đặt",
        icon: Settings,
        path: "/admin/settings",
    },
];
