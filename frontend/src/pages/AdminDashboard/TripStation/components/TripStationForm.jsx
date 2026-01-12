import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    InputAdornment,
    Box,
} from "@mui/material";
import { X } from "lucide-react";
import RouteIcon from "@mui/icons-material/Route";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FlagIcon from "@mui/icons-material/Flag";
import PaidIcon from "@mui/icons-material/Paid";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import { getErrorMessage } from "../../../../utils/error";
import "./TripStationForm.scss";

const defaultForm = {
    route_id: "",
    from_location_id: "",
    to_location_id: "",
    price: "",
    duration_minutes: "",
};

const TripStationForm = ({
    open,
    onClose,
    onSubmit,
    mode = "create",
    initialData = null,
    routes = [],
    locations = [],
}) => {
    const [formData, setFormData] = useState(defaultForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                route_id: initialData.route_id || "",
                from_location_id: initialData.from_location_id || "",
                to_location_id: initialData.to_location_id || "",
                price: initialData.price || "",
                duration_minutes: initialData.duration_minutes || "",
            });
        } else {
            setFormData(defaultForm);
        }
        setErrors({});
    }, [initialData, open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.route_id) {
            newErrors.route_id = "Vui lòng chọn tuyến đường";
        }

        if (!formData.from_location_id) {
            newErrors.from_location_id = "Vui lòng chọn điểm đón";
        }

        if (!formData.to_location_id) {
            newErrors.to_location_id = "Vui lòng chọn điểm trả";
        }

        if (
            formData.from_location_id &&
            formData.to_location_id &&
            formData.from_location_id === formData.to_location_id
        ) {
            newErrors.to_location_id = "Điểm trả phải khác điểm đón";
        }

        if (!formData.price || formData.price < 0) {
            newErrors.price = "Vui lòng nhập giá hợp lệ (≥ 0)";
        }

        if (!formData.duration_minutes || formData.duration_minutes < 1) {
            newErrors.duration_minutes = "Vui lòng nhập thời gian hợp lệ (≥ 1 phút)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await onSubmit({
                route_id: parseInt(formData.route_id),
                from_location_id: parseInt(formData.from_location_id),
                to_location_id: parseInt(formData.to_location_id),
                price: parseInt(formData.price),
                duration_minutes: parseInt(formData.duration_minutes),
            });
            onClose();
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    submit: errorMessage || "Có lỗi xảy ra khi lưu chặng",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setFormData(defaultForm);
        setErrors({});
        onClose();
    };

    const availableToLocations = locations.filter(
        (loc) => loc.id !== parseInt(formData.from_location_id)
    );

    const getLocationName = (id) => {
        const loc = locations.find((l) => l.id === parseInt(id));
        return loc?.name || "";
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            className="trip-station-form-dialog"
            PaperProps={{
                className: "trip-station-form-dialog__paper"
            }}
        >
            {/* Header */}
            <DialogTitle className="trip-station-form__header">
                <div className="trip-station-form__header-icon">
                    {mode === "create" ? (
                        <AddCircleOutlineIcon />
                    ) : (
                        <EditIcon />
                    )}
                </div>
                <div className="trip-station-form__header-text">
                    <h2 className="trip-station-form__title">
                        {mode === "create" ? "Thêm chặng mới" : "Chỉnh sửa chặng"}
                    </h2>
                    <p className="trip-station-form__subtitle">
                        {mode === "create"
                            ? "Nhập thông tin chặng mới cho tuyến đường"
                            : "Cập nhật thông tin chặng"}
                    </p>
                </div>
                <button
                    className="trip-station-form__close-btn"
                    onClick={handleClose}
                    disabled={loading}
                >
                    <X size={18} />
                </button>
            </DialogTitle>

            <DialogContent className="trip-station-form__content">
                {/* Route Section */}
                <div className="trip-station-form__section">
                    <div className="trip-station-form__section-header">
                        <RouteIcon className="trip-station-form__section-icon trip-station-form__section-icon--blue" />
                        <span>Tuyến đường</span>
                    </div>
                    <FormControl
                        fullWidth
                        className="trip-station-form__field"
                        error={!!errors.route_id}
                    >
                        <InputLabel id="route-label">Chọn tuyến đường *</InputLabel>
                        <Select
                            labelId="route-label"
                            value={formData.route_id || ""}
                            label="Chọn tuyến đường *"
                            onChange={(e) => handleChange("route_id", e.target.value)}
                            disabled={loading}
                        >
                            <MenuItem value="">
                                <em>Chọn tuyến đường</em>
                            </MenuItem>
                            {routes.map((route) => (
                                <MenuItem key={route.id} value={route.id}>
                                    {route.name || `Tuyến #${route.id}`}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.route_id && (
                            <span className="trip-station-form__error">
                                {errors.route_id}
                            </span>
                        )}
                    </FormControl>
                </div>

                {/* Path Section */}
                <div className="trip-station-form__section">
                    <div className="trip-station-form__section-header">
                        <LocationOnIcon className="trip-station-form__section-icon trip-station-form__section-icon--green" />
                        <span>Chặng</span>
                    </div>

                    <div className="trip-station-form__path-group">
                        <FormControl
                            fullWidth
                            className="trip-station-form__field"
                            error={!!errors.from_location_id}
                        >
                            <InputLabel id="from-location-label">Điểm đón *</InputLabel>
                            <Select
                                labelId="from-location-label"
                                value={formData.from_location_id || ""}
                                label="Điểm đón *"
                                onChange={(e) => handleChange("from_location_id", e.target.value)}
                                disabled={loading}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <LocationOnIcon className="trip-station-form__input-icon trip-station-form__input-icon--from" />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value="">
                                    <em>Chọn điểm đón</em>
                                </MenuItem>
                                {locations.map((location) => (
                                    <MenuItem key={location.id} value={location.id}>
                                        {location.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.from_location_id && (
                                <span className="trip-station-form__error">
                                    {errors.from_location_id}
                                </span>
                            )}
                        </FormControl>

                        <div className="trip-station-form__path-arrow">
                            <ArrowRightAltIcon />
                        </div>

                        <FormControl
                            fullWidth
                            className="trip-station-form__field"
                            error={!!errors.to_location_id}
                        >
                            <InputLabel id="to-location-label">Điểm trả *</InputLabel>
                            <Select
                                labelId="to-location-label"
                                value={formData.to_location_id || ""}
                                label="Điểm trả *"
                                onChange={(e) => handleChange("to_location_id", e.target.value)}
                                disabled={loading}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <FlagIcon className="trip-station-form__input-icon trip-station-form__input-icon--to" />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value="">
                                    <em>Chọn điểm trả</em>
                                </MenuItem>
                                {availableToLocations.map((location) => (
                                    <MenuItem key={location.id} value={location.id}>
                                        {location.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.to_location_id && (
                                <span className="trip-station-form__error">
                                    {errors.to_location_id}
                                </span>
                            )}
                        </FormControl>
                    </div>

                    {/* Path Preview */}
                    {formData.from_location_id && formData.to_location_id && (
                        <div className="trip-station-form__path-preview">
                            <span className="trip-station-form__path-preview-from">
                                {getLocationName(formData.from_location_id)}
                            </span>
                            <ArrowRightAltIcon className="trip-station-form__path-preview-arrow" />
                            <span className="trip-station-form__path-preview-to">
                                {getLocationName(formData.to_location_id)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Pricing Section */}
                <div className="trip-station-form__section">
                    <div className="trip-station-form__section-header">
                        <PaidIcon className="trip-station-form__section-icon trip-station-form__section-icon--orange" />
                        <span>Giá vé & Thời gian</span>
                    </div>

                    <div className="trip-station-form__pricing-group">
                        <TextField
                            fullWidth
                            className="trip-station-form__field"
                            label="Giá vé *"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            error={!!errors.price}
                            helperText={errors.price}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PaidIcon className="trip-station-form__input-icon trip-station-form__input-icon--price" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">đ</InputAdornment>
                                ),
                            }}
                            inputProps={{ min: 0, step: 1000 }}
                        />

                        <TextField
                            fullWidth
                            className="trip-station-form__field"
                            label="Thời gian *"
                            type="number"
                            value={formData.duration_minutes}
                            onChange={(e) => handleChange("duration_minutes", e.target.value)}
                            error={!!errors.duration_minutes}
                            helperText={errors.duration_minutes}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTimeIcon className="trip-station-form__input-icon trip-station-form__input-icon--time" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">phút</InputAdornment>
                                ),
                            }}
                            inputProps={{ min: 1 }}
                        />
                    </div>
                </div>

                {errors.submit && (
                    <div className="trip-station-form__submit-error">
                        {errors.submit}
                    </div>
                )}
            </DialogContent>

            <DialogActions className="trip-station-form__actions">
                <Button
                    onClick={handleClose}
                    className="trip-station-form__cancel-btn"
                    disabled={loading}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="trip-station-form__submit-btn"
                    disabled={loading}
                    variant="contained"
                >
                    {loading ? (
                        <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            Đang lưu...
                        </>
                    ) : mode === "create" ? (
                        <>
                            <AddCircleOutlineIcon sx={{ mr: 1, fontSize: 18 }} />
                            Thêm chặng
                        </>
                    ) : (
                        <>
                            <EditIcon sx={{ mr: 1, fontSize: 18 }} />
                            Cập nhật
                        </>
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TripStationForm;
