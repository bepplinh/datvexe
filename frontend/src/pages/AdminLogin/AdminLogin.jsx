import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Shield } from "lucide-react";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import "./AdminLogin.scss";

function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAdminAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            // Sử dụng adminAuthService thông qua context
            await login({
                identifier: username,
                password: password,
                rememberMe: true,
            });

            navigate("/admin", { replace: true });
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            let errorMessage = "Đăng nhập thất bại, vui lòng thử lại.";

            if (status === 401) {
                errorMessage =
                    data?.message || "Sai tên đăng nhập hoặc mật khẩu.";
            } else if (status === 403) {
                errorMessage =
                    data?.message || "Bạn không có quyền truy cập admin.";
            } else if (status === 422) {
                errorMessage =
                    data?.message || "Dữ liệu đăng nhập không hợp lệ.";
            } else if (status === 429) {
                errorMessage =
                    data?.message ||
                    "Bạn đã đăng nhập sai quá nhiều lần, vui lòng thử lại sau.";
            } else if (data?.message) {
                errorMessage = data.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login">
            <div className="admin-login__container">
                {/* Login Card */}
                <div className="admin-login__card">
                    {/* Header */}
                    <div className="admin-login__header">
                        <div className="admin-login__icon-wrapper">
                            <Shield className="admin-login__icon" />
                        </div>
                        <h1 className="admin-login__title">Admin Panel</h1>
                        <p className="admin-login__subtitle">
                            Đăng nhập vào hệ thống quản trị
                        </p>
                    </div>

                    {/* Form */}
                    <form className="admin-login__form" onSubmit={handleSubmit}>
                        {/* Username Field */}
                        <div className="admin-login__field">
                            <label className="admin-login__label">
                                Tên đăng nhập
                            </label>
                            <div className="admin-login__input-wrapper">
                                <User
                                    className="admin-login__input-icon"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    className="admin-login__input"
                                    placeholder="Nhập tên đăng nhập"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="admin-login__field">
                            <label className="admin-login__label">
                                Mật khẩu
                            </label>
                            <div className="admin-login__input-wrapper">
                                <Lock
                                    className="admin-login__input-icon"
                                    size={20}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="admin-login__input"
                                    placeholder="Nhập mật khẩu"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="admin-login__password-toggle"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    disabled={isLoading}
                                    aria-label={
                                        showPassword
                                            ? "Ẩn mật khẩu"
                                            : "Hiện mật khẩu"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="admin-login__error">
                                <span className="admin-login__error-icon">
                                    ⚠️
                                </span>
                                <span className="admin-login__error-text">
                                    {error}
                                </span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="admin-login__submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="admin-login__spinner"></span>
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="admin-login__footer">
                        <p className="admin-login__footer-text">
                            Nhà xe Ngọc Sơn © 2024
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
