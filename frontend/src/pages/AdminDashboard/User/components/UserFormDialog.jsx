import { useState, useEffect } from "react";
import { Loader2, UserPlus, Settings, X, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import "./UserFormDialog.scss";

const UserFormDialog = ({ open, onClose, user, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        phone: "",
        birthday: "",
        gender: "",
        role: "customer",
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: user.username || "",
                email: user.email || "",
                phone: user.phone || "",
                birthday: user.birthday
                    ? dayjs(user.birthday).format("YYYY-MM-DD")
                    : "",
                gender: user.gender || "",
                role: user.role || "customer",
                password: "",
                password_confirmation: "",
            });
        } else {
            setFormData({
                name: "",
                username: "",
                email: "",
                phone: "",
                birthday: "",
                gender: "",
                role: "customer",
                password: "",
                password_confirmation: "",
            });
        }
        setErrors({});
        setShowPassword(false);
    }, [user, open]);

    const handleChange = (field) => (event) => {
        const value = event?.target?.value ?? event;
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        const isEditMode = !!user;

        // Username: required khi tạo mới
        if (!isEditMode && !formData.username.trim()) {
            newErrors.username = "Tên đăng nhập là bắt buộc";
        } else if (formData.username.trim() && formData.username.length > 255) {
            newErrors.username = "Tên đăng nhập không được vượt quá 255 ký tự";
        }

        // Email: nullable nhưng nếu có thì phải đúng format
        if (
            formData.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            newErrors.email = "Email không đúng định dạng";
        }

        // Phone: nullable nhưng nếu có thì phải đúng format
        if (
            formData.phone.trim() &&
            !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))
        ) {
            newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
        }

        // Password: required khi tạo mới, optional khi update
        if (!isEditMode) {
            if (!formData.password.trim()) {
                newErrors.password = "Mật khẩu là bắt buộc";
            } else if (formData.password.length < 6) {
                newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
            } else if (formData.password !== formData.password_confirmation) {
                newErrors.password_confirmation =
                    "Xác nhận mật khẩu không khớp";
            }
        } else {
            // Khi update, nếu có password thì phải validate
            if (formData.password.trim()) {
                if (formData.password.length < 6) {
                    newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
                } else if (
                    formData.password !== formData.password_confirmation
                ) {
                    newErrors.password_confirmation =
                        "Xác nhận mật khẩu không khớp";
                }
            }
        }

        // Role: phải là customer, staff, hoặc admin
        if (
            formData.role &&
            !["customer", "staff", "admin"].includes(formData.role)
        ) {
            newErrors.role = "Vai trò không hợp lệ";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const submitData = {
            name: formData.name || null,
            username: formData.username || null,
            email: formData.email || null,
            phone: formData.phone || null,
            birthday: formData.birthday || null,
            gender: formData.gender || null,
            role: formData.role,
        };

        // Chỉ gửi password nếu có giá trị (khi tạo mới hoặc khi update có thay đổi password)
        if (formData.password.trim()) {
            submitData.password = formData.password;
            submitData.password_confirmation = formData.password_confirmation;
        }

        // Loại bỏ các field null/empty không cần thiết
        Object.keys(submitData).forEach((key) => {
            if (submitData[key] === null || submitData[key] === "") {
                delete submitData[key];
            }
        });

        onSubmit(submitData);
    };

    if (!open) return null;

    return (
        <div className="user-form-dialog-overlay" onClick={onClose}>
            <div
                className="user-form-dialog-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="user-form-dialog-header">
                    <div className="user-form-dialog-header-content">
                        {user ? (
                            <div className="user-form-dialog-icon user-form-dialog-icon--edit">
                                <Settings className="h-5 w-5" />
                            </div>
                        ) : (
                            <div className="user-form-dialog-icon user-form-dialog-icon--add">
                                <UserPlus className="h-5 w-5" />
                            </div>
                        )}
                        <div>
                            <h2 className="user-form-dialog-title">
                                {user
                                    ? "Chỉnh sửa người dùng"
                                    : "Thêm người dùng mới"}
                            </h2>
                            <p className="user-form-dialog-description">
                                {user
                                    ? "Cập nhật thông tin người dùng bên dưới."
                                    : "Điền thông tin để tạo người dùng mới."}
                            </p>
                        </div>
                    </div>
                    <button
                        className="user-form-dialog-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="user-form-dialog-body">
                    <div className="user-form-field">
                        <label htmlFor="username" className="user-form-label">
                            Tên đăng nhập{" "}
                            {!user && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange("username")}
                            placeholder="Nhập tên đăng nhập"
                            disabled={loading || !!user}
                            className={`user-form-input ${
                                errors.username ? "user-form-input--error" : ""
                            }`}
                        />
                        {errors.username && (
                            <p className="user-form-error">{errors.username}</p>
                        )}
                        {user && (
                            <p className="user-form-hint">
                                Không thể thay đổi tên đăng nhập
                            </p>
                        )}
                    </div>

                    <div className="user-form-field">
                        <label htmlFor="name" className="user-form-label">
                            Họ và tên
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange("name")}
                            placeholder="Nhập tên đầy đủ"
                            disabled={loading}
                            className={`user-form-input ${
                                errors.name ? "user-form-input--error" : ""
                            }`}
                        />
                        {errors.name && (
                            <p className="user-form-error">{errors.name}</p>
                        )}
                    </div>

                    <div className="user-form-field">
                        <label htmlFor="email" className="user-form-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange("email")}
                            placeholder="example@email.com"
                            disabled={loading}
                            className={`user-form-input ${
                                errors.email ? "user-form-input--error" : ""
                            }`}
                        />
                        {errors.email && (
                            <p className="user-form-error">{errors.email}</p>
                        )}
                    </div>

                    <div className="user-form-field">
                        <label htmlFor="phone" className="user-form-label">
                            Số điện thoại
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange("phone")}
                            placeholder="0123456789"
                            disabled={loading}
                            className={`user-form-input ${
                                errors.phone ? "user-form-input--error" : ""
                            }`}
                        />
                        {errors.phone && (
                            <p className="user-form-error">{errors.phone}</p>
                        )}
                    </div>

                    <div className="user-form-grid">
                        <div className="user-form-field">
                            <label
                                htmlFor="birthday"
                                className="user-form-label"
                            >
                                Ngày sinh
                            </label>
                            <input
                                id="birthday"
                                type="date"
                                value={formData.birthday}
                                onChange={handleChange("birthday")}
                                max={dayjs().format("YYYY-MM-DD")}
                                disabled={loading}
                                className="user-form-input"
                            />
                        </div>

                        <div className="user-form-field">
                            <label htmlFor="gender" className="user-form-label">
                                Giới tính
                            </label>
                            <div className="user-form-select-wrapper">
                                <select
                                    id="gender"
                                    value={formData.gender}
                                    onChange={handleChange("gender")}
                                    disabled={loading}
                                    className="user-form-select"
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                                <ChevronDown className="user-form-select-icon" />
                            </div>
                        </div>
                    </div>

                    <div className="user-form-field">
                        <label htmlFor="role" className="user-form-label">
                            Vai trò{" "}
                            {!user && <span className="text-red-500">*</span>}
                        </label>
                        <div className="user-form-select-wrapper">
                            <select
                                id="role"
                                value={formData.role}
                                onChange={handleChange("role")}
                                disabled={loading}
                                className="user-form-select"
                            >
                                <option value="customer">Khách hàng</option>
                                <option value="staff">Nhân viên</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                            <ChevronDown className="user-form-select-icon" />
                        </div>
                        {errors.role && (
                            <p className="user-form-error">{errors.role}</p>
                        )}
                    </div>

                    <div className="user-form-field">
                        <label htmlFor="password" className="user-form-label">
                            Mật khẩu{" "}
                            {!user && <span className="text-red-500">*</span>}
                            {user && (
                                <span className="text-gray-500 text-sm">
                                    (Để trống nếu không đổi)
                                </span>
                            )}
                        </label>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange("password")}
                            placeholder={
                                user
                                    ? "Nhập mật khẩu mới (tùy chọn)"
                                    : "Nhập mật khẩu (tối thiểu 6 ký tự)"
                            }
                            disabled={loading}
                            className={`user-form-input ${
                                errors.password ? "user-form-input--error" : ""
                            }`}
                        />
                        {errors.password && (
                            <p className="user-form-error">{errors.password}</p>
                        )}
                    </div>

                    {formData.password && (
                        <div className="user-form-field">
                            <label
                                htmlFor="password_confirmation"
                                className="user-form-label"
                            >
                                Xác nhận mật khẩu{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password_confirmation"
                                type={showPassword ? "text" : "password"}
                                value={formData.password_confirmation}
                                onChange={handleChange("password_confirmation")}
                                placeholder="Nhập lại mật khẩu"
                                disabled={loading}
                                className={`user-form-input ${
                                    errors.password_confirmation
                                        ? "user-form-input--error"
                                        : ""
                                }`}
                            />
                            {errors.password_confirmation && (
                                <p className="user-form-error">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>
                    )}

                    {formData.password && (
                        <div className="user-form-field">
                            <label className="user-form-checkbox">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={(e) =>
                                        setShowPassword(e.target.checked)
                                    }
                                />
                                <span>Hiển thị mật khẩu</span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="user-form-dialog-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="user-form-button user-form-button--outline"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="user-form-button user-form-button--primary"
                    >
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {user ? "Cập nhật" : "Tạo mới"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserFormDialog;
