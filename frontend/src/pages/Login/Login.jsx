import React, { useState } from "react";
import "./login.scss";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!identifier || !password) {
            toast.error("Vui lòng nhập đầy đủ tài khoản và mật khẩu");
            return;
        }

        try {
            setSubmitting(true);

            await login({
                identifier,
                password,
                rememberMe,
            });

            toast.success("Đăng nhập thành công");
            navigate("/", { replace: true });
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            let errorMessage = "Đăng nhập thất bại, vui lòng thử lại.";

            if (status === 422) {
                const validationErrors = data?.errors;
                if (validationErrors) {
                    const firstError =
                        validationErrors.identifier?.[0] ||
                        validationErrors.password?.[0];
                    if (firstError) {
                        errorMessage = firstError;
                    } else {
                        errorMessage =
                            data.message || "Dữ liệu đăng nhập không hợp lệ.";
                    }
                }
            } else {
                // Xử lý các lỗi API khác (401, 403, 429)
                const apiMessage = data?.message;

                if (status === 401) {
                    errorMessage =
                        apiMessage ||
                        "Sai tài khoản hoặc mật khẩu, vui lòng thử lại.";
                } else if (status === 403) {
                    errorMessage =
                        apiMessage || "Số điện thoại chưa được xác thực.";
                } else if (status === 429) {
                    errorMessage =
                        apiMessage ||
                        "Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau.";
                } else if (apiMessage) {
                    errorMessage = apiMessage;
                }
            }

            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page__container">
                <div className="login-card">
                    {/* Logo + Title */}
                    <div className="login-card__header">
                        <div className="login-card__title-group">
                            <p className="login-card__title">
                                Đăng nhập tài khoản của bạn
                            </p>
                            <p className="login-card__subtitle">
                                Vui lòng nhập thông tin chi tiết của bạn.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-form__field">
                            <label className="login-form__label">
                                Tên đăng nhập / Số điện thoại
                            </label>
                            <input
                                type="text"
                                className="login-form__input"
                                placeholder="Nhập username hoặc số điện thoại"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>

                        <div className="login-form__field">
                            <label className="login-form__label">
                                Mật khẩu
                            </label>
                            <div className="login-form__password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="login-form__input login-form__input--no-right-radius"
                                    placeholder="Nhập mật khẩu của bạn"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    className="login-form__password-toggle"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword
                                            ? "visibility_off"
                                            : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* remember_me */}
                        <div
                            className="login-form__field"
                            style={{ marginTop: "-0.25rem" }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                />
                                <span>Ghi nhớ đăng nhập</span>
                            </label>
                        </div>

                        <div className="login-form__forgot">
                            <a href="#" className="login-form__forgot-link">
                                Quên mật khẩu?
                            </a>
                        </div>

                        {error && <p className="login-form__error">{error}</p>}

                        <div className="login-form__actions">
                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Đang đăng nhập..."
                                    : "Đăng nhập"}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="login-divider">
                        <span className="login-divider__line" />
                        <p className="login-divider__text">hoặc tiếp tục với</p>
                        <span className="login-divider__line" />
                    </div>

                    {/* Google button */}
                    <div className="login-card__social">
                        <button className="btn btn--google" type="button">
                            <svg
                                className="btn__google-icon"
                                height="48"
                                viewBox="0 0 48 48"
                                width="48"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                                    fill="#fbc02d"
                                ></path>
                                <path
                                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                                    fill="#e53935"
                                ></path>
                                <path
                                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.223,0-9.657-3.356-11.303-7.918l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                                    fill="#4caf50"
                                ></path>
                                <path
                                    d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                                    fill="#1565c0"
                                ></path>
                            </svg>
                            Đăng nhập bằng Google
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="login-footer">
                        <p className="login-footer__text">
                            Chưa có tài khoản?{" "}
                            <Link to="/register" className="login-footer__link">
                                Tạo tài khoản
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
