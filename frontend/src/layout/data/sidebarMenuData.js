import { LayoutDashboard, Users, Ticket, Bus, Settings } from "lucide-react";

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
        id: "settings",
        label: "Cài đặt",
        icon: Settings,
        path: "/admin/settings",
    },
];
