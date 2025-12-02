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
import { getErrorMessage } from "../../../../utils/error";
import { adminBusTypeService } from "../../../../services/admin/busTypeService";
import "./BusForm.scss";

const BusForm = ({ open, onClose, onSubmit, initialData = null, seatLayoutTemplates = [] }) => {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        plate_number: "",
        type_bus_id: "",
        seat_layout_template_id: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [busTypes, setBusTypes] = useState([]);
    const [loadingBusTypes, setLoadingBusTypes] = useState(false);

    // Load initial data nếu đang edit
    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code || "",
                name: initialData.name || "",
                plate_number: initialData.plate_number || "",
                type_bus_id: initialData.type_bus_id || "",
                seat_layout_template_id: initialData.seat_layout_template_id || "",
            });
        } else {
            setFormData({
                code: "",
                name: "",
                plate_number: "",
                type_bus_id: "",
                seat_layout_template_id: "",
            });
        }
        setErrors({});
    }, [initialData, open]);

    // Load bus types khi mở form
    useEffect(() => {
        if (open) {
            loadBusTypes();
        }
    }, [open]);

    const loadBusTypes = async () => {
        try {
            setLoadingBusTypes(true);
            const response = await adminBusTypeService.getBusTypes();
            if (response.data) {
                setBusTypes(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error("Error loading bus types:", error);
        } finally {
            setLoadingBusTypes(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error khi user nhập
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = "Mã xe là bắt buộc";
        }

        if (!formData.name.trim()) {
            newErrors.name = "Tên xe là bắt buộc";
        }

        if (!formData.plate_number.trim()) {
            newErrors.plate_number = "Biển số xe là bắt buộc";
        }

        if (!formData.type_bus_id) {
            newErrors.type_bus_id = "Loại xe là bắt buộc";
        }

        if (!formData.seat_layout_template_id) {
            newErrors.seat_layout_template_id = "Mẫu sơ đồ ghế là bắt buộc";
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
                code: formData.code.trim(),
                name: formData.name.trim(),
                plate_number: formData.plate_number.trim(),
                type_bus_id: parseInt(formData.type_bus_id),
                seat_layout_template_id: parseInt(formData.seat_layout_template_id),
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
            code: "",
            name: "",
            plate_number: "",
            type_bus_id: "",
            seat_layout_template_id: "",
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            className="bus-form-dialog"
        >
            <DialogTitle className="bus-form__title">
                {initialData ? "Chỉnh sửa xe" : "Thêm xe mới"}
                <button
                    className="bus-form__close-btn"
                    onClick={handleClose}
                >
                    <X size={20} />
                </button>
            </DialogTitle>

            <DialogContent className="bus-form__content">
                <Box className="bus-form__fields">
                    <TextField
                        fullWidth
                        label="Mã xe *"
                        value={formData.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        error={!!errors.code}
                        helperText={errors.code}
                        className="bus-form__field"
                        disabled={loading}
                        placeholder="Ví dụ: BUS001"
                    />

                    <TextField
                        fullWidth
                        label="Tên xe *"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        className="bus-form__field"
                        disabled={loading}
                        placeholder="Ví dụ: Xe khách 01"
                    />

                    <TextField
                        fullWidth
                        label="Biển số xe *"
                        value={formData.plate_number}
                        onChange={(e) => handleChange("plate_number", e.target.value)}
                        error={!!errors.plate_number}
                        helperText={errors.plate_number}
                        className="bus-form__field"
                        disabled={loading}
                        placeholder="Ví dụ: 30A-12345"
                    />

                    <FormControl
                        fullWidth
                        className="bus-form__field"
                        error={!!errors.type_bus_id}
                        disabled={loading || loadingBusTypes}
                    >
                        <InputLabel id="type-bus-label">Loại xe *</InputLabel>
                        <Select
                            labelId="type-bus-label"
                            id="type_bus_id"
                            value={formData.type_bus_id || ""}
                            label="Loại xe *"
                            onChange={(e) =>
                                handleChange("type_bus_id", e.target.value)
                            }
                        >
                            <MenuItem value="">Chọn loại xe</MenuItem>
                            {busTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.name} ({type.seat_count} ghế)
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.type_bus_id && (
                            <span className="bus-form__error">
                                {errors.type_bus_id}
                            </span>
                        )}
                    </FormControl>

                    <FormControl
                        fullWidth
                        className="bus-form__field"
                        error={!!errors.seat_layout_template_id}
                        disabled={loading}
                    >
                        <InputLabel id="template-label">Mẫu sơ đồ ghế *</InputLabel>
                        <Select
                            labelId="template-label"
                            id="seat_layout_template_id"
                            value={formData.seat_layout_template_id || ""}
                            label="Mẫu sơ đồ ghế *"
                            onChange={(e) =>
                                handleChange("seat_layout_template_id", e.target.value)
                            }
                        >
                            <MenuItem value="">Chọn mẫu sơ đồ ghế</MenuItem>
                            {seatLayoutTemplates.map((template) => (
                                <MenuItem key={template.id} value={template.id}>
                                    {template.name || `Template #${template.id}`}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.seat_layout_template_id && (
                            <span className="bus-form__error">
                                {errors.seat_layout_template_id}
                            </span>
                        )}
                    </FormControl>

                    {errors.submit && (
                        <Box className="bus-form__submit-error">
                            {errors.submit}
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions className="bus-form__actions">
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    className="bus-form__cancel-btn"
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    className="bus-form__submit-btn"
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

export default BusForm;

