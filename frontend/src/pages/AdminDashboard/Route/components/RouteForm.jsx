import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import { X } from "lucide-react";
import { adminLocationService } from "../../../../services/admin/locationService";
import { getErrorMessage } from "../../../../utils/error";
import { getRouteCityId } from "../../../../utils/route";
import "./RouteForm.scss";

const defaultForm = {
    from_city: "",
    to_city: "",
    name: "",
};

const RouteForm = ({ open, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState(defaultForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        const loadCities = async () => {
            try {
                const response = await adminLocationService.getCities();
                if (response?.data) {
                    setCities(response.data);
                }
            } catch (error) {
                console.error("Failed to load cities", error);
            }
        };
        if (open) {
            loadCities();
        }
    }, [open]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                from_city:
                    getRouteCityId(initialData, "from") ||
                    initialData.from_city ||
                    "",
                to_city:
                    getRouteCityId(initialData, "to") ||
                    initialData.to_city ||
                    "",
                name: initialData.name || "",
            });
        } else {
            setFormData(defaultForm);
        }
        setErrors({});
    }, [initialData, open]);

    const suggestedName = useMemo(() => {
        if (!formData.from_city || !formData.to_city) return "";
        const fromName =
            cities.find((city) => city.id === formData.from_city)?.name || "";
        const toName =
            cities.find((city) => city.id === formData.to_city)?.name || "";
        if (!fromName || !toName) return "";
        return `${fromName} - ${toName}`;
    }, [formData.from_city, formData.to_city, cities]);

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
        if (!formData.from_city) {
            newErrors.from_city = "Vui lòng chọn điểm xuất phát";
        }
        if (!formData.to_city) {
            newErrors.to_city = "Vui lòng chọn điểm đến";
        }
        if (
            formData.from_city &&
            formData.to_city &&
            formData.from_city === formData.to_city
        ) {
            newErrors.to_city = "Điểm đến phải khác điểm xuất phát";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                name: formData.name || suggestedName || "",
            });
            onClose();
        } catch (error) {
            setErrors((prev) => ({
                ...prev,
                submit: getErrorMessage(
                    error,
                    "Có lỗi xảy ra khi lưu tuyến đường. Vui lòng thử lại."
                ),
            }));
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

    const availableDestinationCities = useMemo(() => {
        if (!formData.from_city) return cities;
        return cities.filter((city) => city.id !== formData.from_city);
    }, [cities, formData.from_city]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            className="route-form-dialog"
            transitionDuration={{ enter: 0, exit: 0 }}
        >
            <DialogTitle className="route-form__title">
                {initialData ? "Chỉnh sửa tuyến đường" : "Thêm tuyến đường"}
                <button
                    className="route-form__close-btn"
                    onClick={handleClose}
                    disabled={loading}
                >
                    <X size={18} />
                </button>
            </DialogTitle>
            <DialogContent className="route-form__content">
                <div className="route-form__fields">
                    <FormControl fullWidth className="route-form__field">
                        <InputLabel id="from-city-label">
                            Thành phố xuất phát *
                        </InputLabel>
                        <Select
                            labelId="from-city-label"
                            value={formData.from_city || ""}
                            label="Thành phố xuất phát *"
                            onChange={(e) =>
                                handleChange("from_city", e.target.value)
                            }
                            disabled={loading}
                            endAdornment={
                                loading ? <CircularProgress size={18} /> : null
                            }
                        >
                            {cities.map((city) => (
                                <MenuItem key={city.id} value={city.id}>
                                    {city.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.from_city && (
                            <span className="route-form__error">
                                {errors.from_city}
                            </span>
                        )}
                    </FormControl>

                    <FormControl fullWidth className="route-form__field">
                        <InputLabel id="to-city-label">
                            Thành phố đích *
                        </InputLabel>
                        <Select
                            labelId="to-city-label"
                            value={formData.to_city || ""}
                            label="Thành phố đích *"
                            onChange={(e) =>
                                handleChange("to_city", e.target.value)
                            }
                            disabled={loading}
                        >
                            {availableDestinationCities.map((city) => (
                                <MenuItem key={city.id} value={city.id}>
                                    {city.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.to_city && (
                            <span className="route-form__error">
                                {errors.to_city}
                            </span>
                        )}
                    </FormControl>

                    <TextField
                        label="Tên tuyến (tùy chọn)"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder={
                            suggestedName ? `Gợi ý: ${suggestedName}` : ""
                        }
                        disabled={loading}
                        className="route-form__field"
                    />

                    {errors.submit && (
                        <div className="route-form__submit-error">
                            {errors.submit}
                        </div>
                    )}
                </div>
            </DialogContent>
            <DialogActions className="route-form__actions">
                <Button
                    onClick={handleClose}
                    className="route-form__cancel-btn"
                    disabled={loading}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="route-form__submit-btn"
                    disabled={loading}
                    variant="contained"
                >
                    {loading
                        ? "Đang lưu..."
                        : initialData
                        ? "Cập nhật"
                        : "Thêm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteForm;
