import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
} from "@mui/material";
import { X } from "lucide-react";
import { getErrorMessage } from "../../../../utils/error";
import "./BusTypeForm.scss";

const BusTypeForm = ({ open, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        name: "",
        seat_count: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Load initial data nếu đang edit
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                seat_count: initialData.seat_count || "",
            });
        } else {
            setFormData({
                name: "",
                seat_count: "",
            });
        }
        setErrors({});
    }, [initialData, open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error khi user nhập
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Tên loại xe là bắt buộc";
        }

        if (!formData.seat_count) {
            newErrors.seat_count = "Số ghế là bắt buộc";
        } else {
            const seatCount = parseInt(formData.seat_count);
            if (isNaN(seatCount) || seatCount < 1) {
                newErrors.seat_count = "Số ghế phải là số nguyên dương (tối thiểu 1)";
            }
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
                name: formData.name.trim(),
                seat_count: parseInt(formData.seat_count),
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
            seat_count: "",
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
            className="bus-type-form-dialog"
        >
            <DialogTitle className="bus-type-form__title">
                {initialData ? "Chỉnh sửa loại xe" : "Thêm loại xe mới"}
                <button
                    className="bus-type-form__close-btn"
                    onClick={handleClose}
                >
                    <X size={20} />
                </button>
            </DialogTitle>

            <DialogContent className="bus-type-form__content">
                <Box className="bus-type-form__fields">
                    <TextField
                        fullWidth
                        label="Tên loại xe *"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        className="bus-type-form__field"
                        disabled={loading}
                        placeholder="Ví dụ: Giường nằm, Ghế ngồi, Limousine..."
                    />

                    <TextField
                        fullWidth
                        label="Số ghế *"
                        type="number"
                        value={formData.seat_count}
                        onChange={(e) =>
                            handleChange("seat_count", e.target.value)
                        }
                        error={!!errors.seat_count}
                        helperText={errors.seat_count}
                        className="bus-type-form__field"
                        disabled={loading}
                        inputProps={{ min: 1 }}
                        placeholder="Ví dụ: 40, 45, 50..."
                    />

                    {errors.submit && (
                        <Box className="bus-type-form__submit-error">
                            {errors.submit}
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions className="bus-type-form__actions">
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    className="bus-type-form__cancel-btn"
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    className="bus-type-form__submit-btn"
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

export default BusTypeForm;

