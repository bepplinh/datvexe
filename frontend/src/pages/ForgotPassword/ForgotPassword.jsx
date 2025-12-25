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

    return (
        <div className="forgot-page">
            <div className="forgot-page__container">
                <div className="forgot-card">
                    <div className="forgot-card__header">
                        <div className="forgot-card__title-group">
                            <p className="forgot-card__title">Quên mật khẩu</p>
                            <p className="forgot-card__subtitle">
                                Đặt lại mật khẩu bằng số điện thoại đã xác thực
                            </p>
                        </div>
                    </div>

                    {step === "request" && (
                        <form className="forgot-form" onSubmit={handleSendOtp}>
                            <div className="forgot-form__field">
                                <label className="forgot-form__label">
                                    Số điện thoại (nhập 0xxxxxxxxx)
                                </label>
                                <input
                                    type="text"
                                    className="forgot-form__input"
                                    placeholder="Ví dụ: 0901234567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn--primary forgot-form__btn"
                                disabled={loading}
                            >
                                {loading ? "Đang gửi OTP..." : "Gửi mã OTP"}
                            </button>
                        </form>
                    )}

                    {step === "verify" && (
                        <form className="forgot-form" onSubmit={handleVerify}>
                            <div className="forgot-form__field">
                                <label className="forgot-form__label">
                                    Mã OTP
                                </label>
                                <input
                                    type="text"
                                    className="forgot-form__input"
                                    placeholder="Nhập mã OTP"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <div className="forgot-form__field">
                                <label className="forgot-form__label">
                                    Mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    className="forgot-form__input"
                                    placeholder="Nhập mật khẩu mới"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                />
                            </div>
                            <div className="forgot-form__field">
                                <label className="forgot-form__label">
                                    Xác nhận mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    className="forgot-form__input"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn--primary forgot-form__btn"
                                disabled={loading}
                            >
                                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                            </button>
                        </form>
                    )}

                    <div className="forgot-footer">
                        <Link to="/login" className="forgot-footer__link">
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

