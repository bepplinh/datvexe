import React, { useState, useEffect, useMemo } from "react";
import {
    X,
    Route,
    Bus,
    Calendar,
    Clock,
    Power,
    Save,
    AlertCircle,
} from "lucide-react";
import "./TemplateFormModal.scss";

const WEEKDAYS = [
    { value: 1, label: "Thứ 2" },
    { value: 2, label: "Thứ 3" },
    { value: 3, label: "Thứ 4" },
    { value: 4, label: "Thứ 5" },
    { value: 5, label: "Thứ 6" },
    { value: 6, label: "Thứ 7" },
    { value: 0, label: "Chủ nhật" },
];

const TemplateFormModal = ({
    open,
    onClose,
    onSubmit,
    initialData,
    routes,
    buses,
}) => {
    const [formData, setFormData] = useState({
        route_id: "",
        bus_id: "",
        weekday: 1,
        departure_time: "06:00",
        active: true,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const isEditing = initialData?.id;

    // Initialize form with initial data
    useEffect(() => {
        if (open) {
            if (initialData?.id) {
                // Editing existing template
                setFormData({
                    route_id: initialData.route_id || "",
                    bus_id: initialData.bus_id || "",
                    weekday: initialData.weekday ?? 1,
                    departure_time: initialData.departure_time?.slice(0, 5) || "06:00",
                    active: initialData.active ?? true,
                });
            } else if (initialData?.weekday !== undefined) {
                // Creating new with pre-selected weekday
                setFormData({
                    route_id: "",
                    bus_id: "",
                    weekday: initialData.weekday,
                    departure_time: "06:00",
                    active: true,
                });
            } else {
                // Creating new from scratch
                setFormData({
                    route_id: "",
                    bus_id: "",
                    weekday: 1,
                    departure_time: "06:00",
                    active: true,
                });
            }
            setErrors({});
            setSubmitError("");
        }
    }, [open, initialData]);

    // Search/filter for routes
    const [routeSearch, setRouteSearch] = useState("");
    const filteredRoutes = useMemo(() => {
        if (!routeSearch) return routes;
        const keyword = routeSearch.toLowerCase();
        return routes.filter((r) =>
            r.name?.toLowerCase().includes(keyword)
        );
    }, [routes, routeSearch]);

    // Validate form
    const validate = () => {
        const newErrors = {};
        if (!formData.route_id) {
            newErrors.route_id = "Vui lòng chọn tuyến đường";
        }
        if (!formData.bus_id) {
            newErrors.bus_id = "Vui lòng chọn xe";
        }
        if (!formData.departure_time) {
            newErrors.departure_time = "Vui lòng nhập giờ khởi hành";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setSubmitError("");

        try {
            // Ensure time format is HH:mm:ss
            let formattedTime = formData.departure_time;
            if (formattedTime && formattedTime.length === 5) {
                formattedTime += ":00";
            }

            const dataToSubmit = {
                ...formData,
                departure_time: formattedTime,
                weekday: parseInt(formData.weekday, 10),
                route_id: parseInt(formData.route_id, 10),
                bus_id: parseInt(formData.bus_id, 10),
            };
            await onSubmit(dataToSubmit);
        } catch (err) {
            setSubmitError(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="template-form-modal">
            <div className="template-form-modal__backdrop" onClick={onClose} />
            <div className="template-form-modal__container">
                <div className="template-form-modal__header">
                    <h2>
                        {isEditing ? "Chỉnh sửa lịch mẫu" : "Thêm lịch mẫu mới"}
                    </h2>
                    <button
                        className="template-form-modal__close-btn"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="template-form-modal__form">
                    {/* Route Select */}
                    <div className="template-form-modal__field">
                        <label>
                            <Route size={16} />
                            <span>Tuyến đường</span>
                        </label>
                        <div className="template-form-modal__select-wrapper">
                            <input
                                type="text"
                                placeholder="Tìm tuyến đường..."
                                value={routeSearch}
                                onChange={(e) => setRouteSearch(e.target.value)}
                                className="template-form-modal__search-input"
                            />
                            <select
                                value={formData.route_id}
                                onChange={handleChange("route_id")}
                                className={errors.route_id ? "error" : ""}
                            >
                                <option value="">-- Chọn tuyến đường --</option>
                                {filteredRoutes.map((route) => (
                                    <option key={route.id} value={route.id}>
                                        {route.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.route_id && (
                            <span className="template-form-modal__error">
                                {errors.route_id}
                            </span>
                        )}
                    </div>

                    {/* Bus Select */}
                    <div className="template-form-modal__field">
                        <label>
                            <Bus size={16} />
                            <span>Xe</span>
                        </label>
                        <select
                            value={formData.bus_id}
                            onChange={handleChange("bus_id")}
                            className={errors.bus_id ? "error" : ""}
                        >
                            <option value="">-- Chọn xe --</option>
                            {buses.map((bus) => (
                                <option key={bus.id} value={bus.id}>
                                    {bus.license_plate} - {bus.name}
                                </option>
                            ))}
                        </select>
                        {errors.bus_id && (
                            <span className="template-form-modal__error">
                                {errors.bus_id}
                            </span>
                        )}
                    </div>

                    {/* Weekday Select */}
                    <div className="template-form-modal__field">
                        <label>
                            <Calendar size={16} />
                            <span>Ngày trong tuần</span>
                        </label>
                        <select
                            value={formData.weekday}
                            onChange={handleChange("weekday")}
                        >
                            {WEEKDAYS.map((day) => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time Input */}
                    <div className="template-form-modal__field">
                        <label>
                            <Clock size={16} />
                            <span>Giờ khởi hành</span>
                        </label>
                        <input
                            type="time"
                            value={formData.departure_time}
                            onChange={handleChange("departure_time")}
                            className={errors.departure_time ? "error" : ""}
                        />
                        {errors.departure_time && (
                            <span className="template-form-modal__error">
                                {errors.departure_time}
                            </span>
                        )}
                    </div>

                    {/* Active Toggle */}
                    <div className="template-form-modal__field template-form-modal__field--toggle">
                        <label>
                            <Power size={16} />
                            <span>Trạng thái</span>
                        </label>
                        <label className="template-form-modal__toggle">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={handleChange("active")}
                            />
                            <span className="template-form-modal__toggle-slider"></span>
                            <span className="template-form-modal__toggle-label">
                                {formData.active ? "Đang hoạt động" : "Tạm dừng"}
                            </span>
                        </label>
                    </div>

                    {/* Submit Error */}
                    {submitError && (
                        <div className="template-form-modal__submit-error">
                            <AlertCircle size={16} />
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="template-form-modal__actions">
                        <button
                            type="button"
                            className="template-form-modal__btn template-form-modal__btn--secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="template-form-modal__btn template-form-modal__btn--primary"
                            disabled={loading}
                        >
                            {loading ? (
                                "Đang lưu..."
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>{isEditing ? "Cập nhật" : "Tạo mới"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TemplateFormModal;
