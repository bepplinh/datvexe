import React from "react";
import { User, Mail, Phone, Calendar, Users, Shield, Clock } from "lucide-react";

export const UserInfoTab = ({ user }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="user-detail__info">
            <div className="user-detail__section">
                <h3 className="user-detail__section-title">Thông tin cơ bản</h3>

                <InfoRow icon={User} label="Tên" value={user.name || "N/A"} />
                <InfoRow icon={Mail} label="Email" value={user.email || "N/A"} />
                <InfoRow icon={Phone} label="Số điện thoại" value={user.phone || "N/A"} />
                <InfoRow
                    icon={Calendar}
                    label="Ngày sinh"
                    value={user.birthday ? formatDate(user.birthday) : "Chưa cập nhật"}
                />
                <InfoRow
                    icon={Users}
                    label="Giới tính"
                    value={
                        user.gender === "male" ? "Nam" :
                            user.gender === "female" ? "Nữ" :
                                user.gender === "other" ? "Khác" : "Chưa cập nhật"
                    }
                />
                <InfoRow
                    icon={Shield}
                    label="Vai trò"
                    value={
                        user.role === "admin" ? "Quản trị viên" :
                            user.role === "staff" ? "Nhân viên" : "Khách hàng"
                    }
                />
            </div>

            <div className="user-detail__section">
                <h3 className="user-detail__section-title">Thông tin đăng ký</h3>
                <InfoRow
                    icon={Clock}
                    label="Ngày đăng ký"
                    value={formatDate(user.created_at || user.createdAt)}
                />
                <InfoRow
                    icon={Clock}
                    label="Cập nhật lần cuối"
                    value={formatDate(user.updated_at || user.updatedAt)}
                />
            </div>
        </div>
    );
};

// Helper sub-component for rows
const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="user-detail__row">
        <Icon className="user-detail__icon" size={18} />
        <div>
            <div className="user-detail__label">{label}</div>
            <div className="user-detail__value">{value}</div>
        </div>
    </div>
);
