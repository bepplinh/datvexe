import React, { useState } from "react";
import { X, User, Ticket } from "lucide-react";
import "./UserDetailModal.scss";
import { useUserDetailData } from "./UserDetail/useUserDetailData";
import { UserInfoTab } from "./UserDetail/UserInfoTab";
import { UserTicketsTab } from "./UserDetail/UserTicketsTab";

const UserDetailModal = ({ user, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState("info");

    // Custom hook handles data fetching logic
    const { userTickets, loadingTickets } = useUserDetailData(user, activeTab);

    if (!user) return null;

    return (
        <div className="user-detail-modal__backdrop" onClick={onClose}>
            <div
                className="user-detail-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="user-detail__header">
                    <div>
                        <h2 className="user-detail__title">Chi tiết người dùng</h2>
                        <p className="user-detail__subtitle">ID: {user.id}</p>
                    </div>
                    <button
                        className="user-detail__close-btn"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="user-detail__tabs">
                    <TabButton
                        id="info"
                        label="Thông tin"
                        icon={User}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        id="tickets"
                        label="Lịch sử đặt vé"
                        icon={Ticket}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>

                {/* Body Content */}
                <div className="user-detail__body">
                    {activeTab === "info" && <UserInfoTab user={user} />}

                    {activeTab === "tickets" && (
                        <UserTicketsTab
                            userTickets={userTickets}
                            loadingTickets={loadingTickets}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="user-detail__footer">
                    <button
                        className="user-detail__btn user-detail__btn--secondary"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                    <button
                        className="user-detail__btn user-detail__btn--primary"
                        onClick={() => {
                            onEdit?.(user);
                            onClose();
                        }}
                    >
                        Chỉnh sửa
                    </button>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ id, label, icon: Icon, activeTab, setActiveTab }) => (
    <button
        className={`user-detail__tab ${activeTab === id ? "user-detail__tab--active" : ""
            }`}
        onClick={() => setActiveTab(id)}
    >
        <Icon size={18} />
        {label}
    </button>
);

export default UserDetailModal;

