import React, { useState, useEffect } from "react";
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
    Box,
    CircularProgress,
} from "@mui/material";
import { X } from "lucide-react";
import { adminLocationService } from "../../../../services/admin/locationService";
import { getErrorMessage } from "../../../../utils/error";
import "./LocationForm.scss";

const LocationForm = ({
    open,
    onClose,
    onSubmit,
    initialData = null,
    parentLocation = null,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        type: parentLocation
            ? parentLocation.type === "city"
                ? "district"
                : "ward"
            : "city",
        parent_id: parentLocation?.id || null,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Load initial data nếu đang edit
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                type: initialData.type || "city",
                parent_id: initialData.parent_id || null,
            });
        } else if (parentLocation) {
            setFormData((prev) => ({
                ...prev,
                type: parentLocation.type === "city" ? "district" : "ward",
                parent_id: parentLocation.id,
            }));
        }
    }, [initialData, parentLocation]);

    // Load cities khi mở form
    useEffect(() => {
        if (open && !initialData) {
            loadCities();
        }
    }, [open, initialData]);

    // Load districts khi chọn city (cho ward)
    useEffect(() => {
        // Chỉ load districts khi type là ward và cần chọn district
        // Logic này sẽ được xử lý trong handleChange khi chọn city
    }, [formData.type, formData.parent_id]);

    const loadCities = async () => {
        try {
            setLoadingCities(true);
            const response = await adminLocationService.getCities();
            if (response.success && response.data) {
                setCities(response.data);
            }
        } catch (error) {
            console.error("Error loading cities:", error);
        } finally {
            setLoadingCities(false);
        }
    };

    const loadDistricts = async (cityId) => {
        try {
            setLoadingDistricts(true);
            const response = await adminLocationService.getDistricts(cityId);
            if (response.success && response.data) {
                setDistricts(response.data);
            }
        } catch (error) {
            console.error("Error loading districts:", error);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            // Reset parent_id khi đổi type
            if (field === "type") {
                if (value === "city") {
                    newData.parent_id = null;
                    setDistricts([]);
                } else if (value === "district") {
                    // District cần city làm parent
                    const validCityId =
                        prev.parent_id &&
                        cities.find((c) => c.id === prev.parent_id)
                            ? prev.parent_id
                            : null;
                    newData.parent_id = validCityId;
                    if (validCityId) {
                        loadDistricts(validCityId);
                    } else {
                        setDistricts([]);
                    }
                } else if (value === "ward") {
                    // Ward cần district làm parent
                    const validDistrictId =
                        prev.parent_id &&
                        districts.find((d) => d.id === prev.parent_id)
                            ? prev.parent_id
                            : null;
                    newData.parent_id = validDistrictId;
                }
            }

            // Khi chọn city cho district, load districts
            if (
                field === "parent_id" &&
                formData.type === "district" &&
                value
            ) {
                loadDistricts(value);
            }

            return newData;
        });
        // Clear error khi user nhập
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Tên địa điểm là bắt buộc";
        }

        if (!formData.type) {
            newErrors.type = "Loại địa điểm là bắt buộc";
        }

        if (formData.type === "district" && !formData.parent_id) {
            newErrors.parent_id = "Vui lòng chọn thành phố";
        }

        if (formData.type === "ward" && !formData.parent_id) {
            newErrors.parent_id = "Vui lòng chọn quận/huyện";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                parent_id: formData.parent_id || null,
            };
            await onSubmit(submitData);
            handleClose();
        } catch (error) {
            console.error("Error submitting form:", error);
            setErrors({
                submit: getErrorMessage(error, "Có lỗi xảy ra"),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            type: parentLocation
                ? parentLocation.type === "city"
                    ? "district"
                    : "ward"
                : "city",
            parent_id: parentLocation?.id || null,
        });
        setErrors({});
        onClose();
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case "city":
                return "Thành phố";
            case "district":
                return "Quận/Huyện";
            case "ward":
                return "Phường/Xã";
            default:
                return type;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            className="location-form-dialog"
        >
            <DialogTitle className="location-form__title">
                {initialData ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}
                <button
                    className="location-form__close-btn"
                    onClick={handleClose}
                >
                    <X size={20} />
                </button>
            </DialogTitle>

            <DialogContent className="location-form__content">
                <Box className="location-form__fields">
                    <TextField
                        fullWidth
                        label="Tên địa điểm *"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        className="location-form__field"
                        disabled={loading}
                    />

                    <FormControl
                        fullWidth
                        className="location-form__field"
                        error={!!errors.type}
                        disabled={loading || !!parentLocation}
                    >
                        <InputLabel id="type-label">Loại địa điểm *</InputLabel>
                        <Select
                            labelId="type-label"
                            id="type"
                            value={formData.type}
                            label="Loại địa điểm *"
                            onChange={(e) =>
                                handleChange("type", e.target.value)
                            }
                        >
                            {!parentLocation && (
                                <MenuItem value="city">Thành phố</MenuItem>
                            )}
                            {(!parentLocation ||
                                parentLocation.type === "city") && (
                                <MenuItem value="district">Quận/Huyện</MenuItem>
                            )}
                            {(!parentLocation ||
                                parentLocation.type === "district") && (
                                <MenuItem value="ward">Phường/Xã</MenuItem>
                            )}
                        </Select>
                        {errors.type && (
                            <span className="location-form__error">
                                {errors.type}
                            </span>
                        )}
                    </FormControl>

                    {/* Parent Selection */}
                    {formData.type === "district" && (
                        <FormControl
                            fullWidth
                            className="location-form__field"
                            error={!!errors.parent_id}
                            disabled={loading || !!parentLocation}
                        >
                            <InputLabel id="parent-label">
                                Thành phố *
                            </InputLabel>
                            <Select
                                labelId="parent-label"
                                id="parent"
                                value={formData.parent_id || ""}
                                label="Thành phố *"
                                onChange={(e) =>
                                    handleChange("parent_id", e.target.value)
                                }
                                endAdornment={
                                    loadingCities ? (
                                        <CircularProgress size={20} />
                                    ) : null
                                }
                            >
                                <MenuItem value="">Chọn thành phố</MenuItem>
                                {cities.map((city) => (
                                    <MenuItem key={city.id} value={city.id}>
                                        {city.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.parent_id && (
                                <span className="location-form__error">
                                    {errors.parent_id}
                                </span>
                            )}
                        </FormControl>
                    )}

                    {formData.type === "ward" && (
                        <FormControl
                            fullWidth
                            className="location-form__field"
                            error={!!errors.parent_id}
                            disabled={loading || !!parentLocation}
                        >
                            <InputLabel id="parent-label">
                                Quận/Huyện *
                            </InputLabel>
                            <Select
                                labelId="parent-label"
                                id="parent"
                                value={formData.parent_id || ""}
                                label="Quận/Huyện *"
                                onChange={(e) =>
                                    handleChange("parent_id", e.target.value)
                                }
                                endAdornment={
                                    loadingDistricts ? (
                                        <CircularProgress size={20} />
                                    ) : null
                                }
                            >
                                <MenuItem value="">Chọn quận/huyện</MenuItem>
                                {districts.map((district) => (
                                    <MenuItem
                                        key={district.id}
                                        value={district.id}
                                    >
                                        {district.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.parent_id && (
                                <span className="location-form__error">
                                    {errors.parent_id}
                                </span>
                            )}
                        </FormControl>
                    )}

                    {parentLocation && (
                        <Box className="location-form__parent-info">
                            <span className="location-form__parent-label">
                                Địa điểm cha:
                            </span>
                            <span className="location-form__parent-name">
                                {parentLocation.name} (
                                {getTypeLabel(parentLocation.type)})
                            </span>
                        </Box>
                    )}

                    {errors.submit && (
                        <Box className="location-form__submit-error">
                            {errors.submit}
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions className="location-form__actions">
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    className="location-form__cancel-btn"
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    className="location-form__submit-btn"
                >
                    {loading ? (
                        <>
                            <CircularProgress size={16} />
                            <span style={{ marginLeft: 8 }}>Đang xử lý...</span>
                        </>
                    ) : initialData ? (
                        "Cập nhật"
                    ) : (
                        "Thêm mới"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LocationForm;
