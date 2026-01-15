import React, { useState } from "react";
import { Clock, Bus, Route, Edit2, Trash2, Power, MoreVertical } from "lucide-react";
import "./TimeSlotCard.scss";

const TimeSlotCard = ({
    template,
    colorScheme,
    onEdit,
    onDelete,
    onToggleActive,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const routeName = template.route?.name || `Tuyến #${template.route_id}`;
    const busPlate = template.bus?.license_plate || `Xe #${template.bus_id}`;
    const isActive = template.active;

    // Format time to HH:mm (e.g., "09:00")
    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        return timeStr.slice(0, 5); // "09:00:00" -> "09:00"
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleAction = (action) => (e) => {
        e.stopPropagation();
        setShowMenu(false);
        action();
    };

    return (
        <div
            className={`time-slot-card ${!isActive ? "time-slot-card--inactive" : ""}`}
            style={{
                backgroundColor: colorScheme.bg,
                borderColor: colorScheme.border,
            }}
            onClick={onEdit}
        >
            <div className="time-slot-card__header">
                <div className="time-slot-card__time" style={{ color: colorScheme.text }}>
                    <Clock size={12} />
                    <span>{formatTime(template.departure_time)}</span>
                </div>
                <button
                    className="time-slot-card__menu-btn"
                    onClick={handleMenuClick}
                >
                    <MoreVertical size={14} />
                </button>
            </div>

            <div className="time-slot-card__content">
                <div className="time-slot-card__route" title={routeName}>
                    <Route size={12} />
                    <span>{routeName}</span>
                </div>
                <div className="time-slot-card__bus" title={busPlate}>
                    <Bus size={12} />
                    <span>{busPlate}</span>
                </div>
            </div>

            {!isActive && (
                <div className="time-slot-card__status">
                    <span>Tạm dừng</span>
                </div>
            )}

            {/* Context Menu */}
            {showMenu && (
                <>
                    <div
                        className="time-slot-card__menu-backdrop"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                    />
                    <div className="time-slot-card__menu">
                        <button
                            className="time-slot-card__menu-item"
                            onClick={handleAction(onEdit)}
                        >
                            <Edit2 size={14} />
                            <span>Chỉnh sửa</span>
                        </button>
                        <button
                            className="time-slot-card__menu-item"
                            onClick={handleAction(onToggleActive)}
                        >
                            <Power size={14} />
                            <span>{isActive ? "Tạm dừng" : "Kích hoạt"}</span>
                        </button>
                        <button
                            className="time-slot-card__menu-item time-slot-card__menu-item--danger"
                            onClick={handleAction(onDelete)}
                        >
                            <Trash2 size={14} />
                            <span>Xóa</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TimeSlotCard;
