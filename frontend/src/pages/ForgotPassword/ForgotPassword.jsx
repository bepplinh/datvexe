import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../../services/authService";
import "./ForgotPassword.scss";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState("request"); // request -> verify
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Chuẩn hóa số điện thoại: nhận 0xxxxxxxxx hoặc 84xxxxxxxxx, tự thêm +84
    const normalizePhone = (raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("+")) return trimmed;
        if (trimmed.startsWith("0")) return `+84${trimmed.slice(1)}`;
        if (trimmed.startsWith("84")) return `+${trimmed}`;
        return `+84${trimmed}`;
    };

    const showValidationErrors = (errors) => {
        if (!errors || typeof errors !== "object") return false;
        const messages = Object.values(errors)
            .flat()
            .filter(Boolean);
        if (!messages.length) return false;
        messages.forEach((msg) => toast.error(msg));
        return true;
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!phone.trim()) {
            toast.error("Vui lòng nhập số điện thoại");
            return;
        }
        const normalizedPhone = normalizePhone(phone);

        try {
            setLoading(true);
            await authService.sendOtp({
                phone: normalizedPhone,
                purpose: "reset_password",
                channel: "sms",
            });
            toast.success("Đã gửi mã OTP, vui lòng kiểm tra tin nhắn");
            setStep("verify");
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (!showValidationErrors(errors)) {
                const message =
                    err.response?.data?.message ||
                    "Gửi OTP thất bại, vui lòng thử lại";
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            toast.error("Vui lòng nhập mã OTP");
            return;
        }
        if (!newPassword) {
            toast.error("Vui lòng nhập mật khẩu mới");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Mật khẩu tối thiểu 6 ký tự");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Xác nhận mật khẩu không khớp");
            return;
        }
        const normalizedPhone = normalizePhone(phone);

        try {
            setLoading(true);
            await authService.verifyOtp({
                phone: normalizedPhone,
                code: code.trim(),
                purpose: "reset_password",
                newPassword,
            });
            toast.success("Đặt lại mật khẩu thành công, vui lòng đăng nhập");
            navigate("/login", { replace: true });
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (!showValidationErrors(errors)) {
                const message =
                    err.response?.data?.message ||
                    "Xác thực OTP thất bại, vui lòng thử lại";
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        const normalizedPhone = normalizePhone(phone);
        try {
            setLoading(true);
            await authService.sendOtp({
                phone: normalizedPhone,
                purpose: "reset_password",
                channel: "sms",
            });
            toast.success("Đã gửi lại mã OTP");
        } catch (err) {
            toast.error("Gửi lại OTP thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-page">
            <div className="forgot-page__container">
                <div className="forgot-card">
                    {/* Icon */}
                    <div className="forgot-card__icon">
                        {step === "request" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        )}
                    </div>

                    {/* Header */}
                    <div className="forgot-card__header">
                        <h1 className="forgot-card__title">
                            {step === "request" ? "Quên mật khẩu?" : "Xác thực OTP"}
                        </h1>
                        <p className="forgot-card__subtitle">
                            {step === "request"
                                ? "Nhập số điện thoại để nhận mã xác thực"
                                : `Mã OTP đã được gửi đến ${phone}`}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="forgot-card__steps">
                        <div className={`forgot-card__step ${step === "request" ? "forgot-card__step--active" : "forgot-card__step--completed"}`}>
                            <span className="forgot-card__step-number">1</span>
                            <span className="forgot-card__step-label">Nhập SĐT</span>
                        </div>
                        <div className="forgot-card__step-line"></div>
                        <div className={`forgot-card__step ${step === "verify" ? "forgot-card__step--active" : ""}`}>
                            <span className="forgot-card__step-number">2</span>
                            <span className="forgot-card__step-label">Đặt lại</span>
                        </div>
                    </div>

                    {step === "request" && (
                        <form className="forgot-form" onSubmit={handleSendOtp}>
                            <div className="forgot-form__field">
                                <label className="forgot-form__label">
                                    Số điện thoại
                                </label>
                                <div className="forgot-form__input-wrapper">
                                    <span className="forgot-form__input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="tel"
                                        className="forgot-form__input"
                                        placeholder="Ví dụ: 0901234567"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        autoComplete="tel"
                                    />
                                </div>
                                <span className="forgot-form__hint">
                                    Nhập số điện thoại đã đăng ký tài khoản
                                </span>
                            </div>
                            <button
                                type="submit"
                                className="forgot-form__btn forgot-form__btn--primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="forgot-form__spinner"></span>
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m22 2-7 20-4-9-9-4Z" />
                                            <path d="M22 2 11 13" />
                                        </svg>
                                        Gửi mã OTP
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {step === "verify" && (
                        <form className="forgot-form" onSubmit={handleVerify}>
                            <div className="forgot-form__field">
                                <label className="forgot-form__label">Mã OTP</label>
                                <div className="forgot-form__input-wrapper">
                                    <span className="forgot-form__input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="7" height="7" x="3" y="3" rx="1" />
                                            <rect width="7" height="7" x="14" y="3" rx="1" />
                                            <rect width="7" height="7" x="14" y="14" rx="1" />
                                            <rect width="7" height="7" x="3" y="14" rx="1" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        className="forgot-form__input forgot-form__input--otp"
                                        placeholder="Nhập mã 6 số"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="forgot-form__resend"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                >
                                    Gửi lại mã OTP
                                </button>
                            </div>

                            <div className="forgot-form__field">
                                <label className="forgot-form__label">Mật khẩu mới</label>
                                <div className="forgot-form__input-wrapper">
                                    <span className="forgot-form__input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="forgot-form__input"
                                        placeholder="Tối thiểu 6 ký tự"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="forgot-form__toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                <line x1="2" x2="22" y1="2" y2="22" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="forgot-form__field">
                                <label className="forgot-form__label">Xác nhận mật khẩu</label>
                                <div className="forgot-form__input-wrapper">
                                    <span className="forgot-form__input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="forgot-form__input"
                                        placeholder="Nhập lại mật khẩu"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="forgot-form__toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                <line x1="2" x2="22" y1="2" y2="22" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {newPassword && confirmPassword && newPassword === confirmPassword && (
                                    <span className="forgot-form__match">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                        Mật khẩu khớp
                                    </span>
                                )}
                            </div>

                            <div className="forgot-form__actions">
                                <button
                                    type="button"
                                    className="forgot-form__btn forgot-form__btn--secondary"
                                    onClick={() => setStep("request")}
                                    disabled={loading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m12 19-7-7 7-7" />
                                        <path d="M19 12H5" />
                                    </svg>
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    className="forgot-form__btn forgot-form__btn--primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="forgot-form__spinner"></span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                            Đặt lại mật khẩu
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="forgot-footer">
                        <span className="forgot-footer__text">Đã nhớ mật khẩu?</span>
                        <Link to="/login" className="forgot-footer__link">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
