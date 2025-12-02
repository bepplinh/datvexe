import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Box,
    Divider,
} from "@mui/material";
import { X } from "lucide-react";
import "./TripDetailModal.scss";

const TripDetailModal = ({ open, onClose, trip }) => {
    if (!trip) return null;

    const getStatusChip = (status) => {
        const statusMap = {
            scheduled: { label: "Đã lên lịch", color: "info" },
            running: { label: "Đang chạy", color: "success" },
            finished: { label: "Hoàn thành", color: "default" },
            cancelled: { label: "Đã hủy", color: "error" },
        };

        const statusInfo = statusMap[status] || {
            label: status || "N/A",
            color: "default",
        };

        return (
            <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="medium"
                variant="outlined"
            />
        );
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return "N/A";
        try {
            return new Date(dateTime).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
        } catch {
            return dateTime;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            className="trip-detail-modal"
        >
            <DialogTitle className="trip-detail-modal__title">
                Chi tiết chuyến xe #{trip.id}
                <button
                    className="trip-detail-modal__close-btn"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>
            </DialogTitle>
            <DialogContent className="trip-detail-modal__content">
                <div className="trip-detail-modal__section">
                    <h3 className="trip-detail-modal__section-title">
                        Thông tin cơ bản
                    </h3>
                    <div className="trip-detail-modal__grid">
                        <div className="trip-detail-modal__item">
                            <span className="trip-detail-modal__label">ID</span>
                            <strong className="trip-detail-modal__value">
                                #{trip.id}
                            </strong>
                        </div>
                        <div className="trip-detail-modal__item">
                            <span className="trip-detail-modal__label">
                                Trạng thái
                            </span>
                            <div className="trip-detail-modal__value">
                                {getStatusChip(trip.status)}
                            </div>
                        </div>
                    </div>
                </div>

                <Divider sx={{ my: 2 }} />

                <div className="trip-detail-modal__section">
                    <h3 className="trip-detail-modal__section-title">
                        Thông tin tuyến đường
                    </h3>
                    <div className="trip-detail-modal__grid">
                        <div className="trip-detail-modal__item">
                            <span className="trip-detail-modal__label">
                                Tuyến đường
                            </span>
                            <strong className="trip-detail-modal__value">
                                {trip.route?.name || `Tuyến #${trip.route_id}`}
                            </strong>
                        </div>
                        {trip.route?.id && (
                            <div className="trip-detail-modal__item">
                                <span className="trip-detail-modal__label">
                                    ID Tuyến
                                </span>
                                <strong className="trip-detail-modal__value">
                                    #{trip.route.id}
                                </strong>
                            </div>
                        )}
                    </div>
                </div>

                <Divider sx={{ my: 2 }} />

                <div className="trip-detail-modal__section">
                    <h3 className="trip-detail-modal__section-title">
                        Thông tin xe bus
                    </h3>
                    <div className="trip-detail-modal__grid">
                        <div className="trip-detail-modal__item">
                            <span className="trip-detail-modal__label">
                                Xe bus
                            </span>
                            <strong className="trip-detail-modal__value">
                                {trip.bus
                                    ? trip.bus.license_plate || `Xe #${trip.bus.id}`
                                    : "Chưa gán"}
                            </strong>
                        </div>
                        {trip.bus?.id && (
                            <div className="trip-detail-modal__item">
                                <span className="trip-detail-modal__label">
                                    ID Xe
                                </span>
                                <strong className="trip-detail-modal__value">
                                    #{trip.bus.id}
                                </strong>
                            </div>
                        )}
                    </div>
                </div>

                <Divider sx={{ my: 2 }} />

                <div className="trip-detail-modal__section">
                    <h3 className="trip-detail-modal__section-title">
                        Thời gian
                    </h3>
                    <div className="trip-detail-modal__grid">
                        <div className="trip-detail-modal__item">
                            <span className="trip-detail-modal__label">
                                Thời gian khởi hành
                            </span>
                            <strong className="trip-detail-modal__value">
                                {formatDateTime(trip.departure_time)}
                            </strong>
                        </div>
                    </div>
                </div>

                {trip.created_at && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <div className="trip-detail-modal__section">
                            <h3 className="trip-detail-modal__section-title">
                                Thông tin hệ thống
                            </h3>
                            <div className="trip-detail-modal__grid">
                                <div className="trip-detail-modal__item">
                                    <span className="trip-detail-modal__label">
                                        Ngày tạo
                                    </span>
                                    <strong className="trip-detail-modal__value">
                                        {formatDateTime(trip.created_at)}
                                    </strong>
                                </div>
                                {trip.updated_at && (
                                    <div className="trip-detail-modal__item">
                                        <span className="trip-detail-modal__label">
                                            Cập nhật lần cuối
                                        </span>
                                        <strong className="trip-detail-modal__value">
                                            {formatDateTime(trip.updated_at)}
                                        </strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
            <DialogActions className="trip-detail-modal__actions">
                <Button
                    onClick={onClose}
                    className="trip-detail-modal__close-button"
                    variant="contained"
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TripDetailModal;

