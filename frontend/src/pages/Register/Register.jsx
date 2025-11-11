import React, { useState, useEffect } from "react";
import "./Register.scss";

const OTP_COUNTDOWN = 60; // thời gian đếm ngược (giây)

const RegisterPage = () => {
    const [step, setStep] = useState("PHONE"); // PHONE | OTP
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [isSending, setIsSending] = useState(false);

    // Đếm ngược OTP
    useEffect(() => {
        if (step !== "OTP" || countdown <= 0) return;

        const intervalId = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [step, countdown]);

    const handleSendOtp = async () => {
        if (!phone.trim()) {
            alert("Vui lòng nhập số điện thoại");
            return;
        }

        try {
            setIsSending(true);
            // TODO: gọi API gửi OTP, ví dụ:
            // await api.post('/auth/send-otp', { phone })

            // Nếu gửi thành công:
            setStep("OTP");
            setCountdown(OTP_COUNTDOWN);
        } catch (error) {
            console.error(error);
            alert("Gửi OTP thất bại, vui lòng thử lại.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (step === "PHONE") {
            handleSendOtp();
        } else {
            // TODO: gọi API verify OTP
            // await api.post('/auth/verify-otp', { phone, otp })
            console.log("Verify OTP:", { phone, otp });
            alert("Giả lập: Xác thực OTP thành công!");
        }
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        handleSendOtp();
    };

    return (
        <div className="login-page">
            <div className="login-page__container">
                <div className="login-card">
                    {/* Header */}
                    <div className="login-card__header">
                        <div className="login-card__logo">
                            <svg
                                className="login-card__logo-icon"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0021 12c0 .778-.099 1.533-.284 2.253M18.716 14.253A9.004 9.004 0 0112 21"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                            </svg>
                        </div>
                        <div className="login-card__title-group">
                            <p className="login-card__title">
                                Đăng ký tài khoản mới
                            </p>
                            <p className="login-card__subtitle">
                                Nhập số điện thoại để nhận mã OTP xác thực.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        {/* Số điện thoại */}
                        <div className="login-form__field">
                            <label className="login-form__label">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                className="login-form__input"
                                placeholder="Nhập số điện thoại của bạn"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={step === "OTP"} // sang bước OTP thì khóa sdt
                            />
                        </div>

                        {/* OTP chỉ hiện ở bước OTP */}
                        {step === "OTP" && (
                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Mã OTP
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="login-form__input"
                                    placeholder="Nhập mã OTP gồm 6 số"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />

                                <div className="otp-extra">
                                    <div className="otp-extra__left">
                                        {countdown > 0 ? (
                                            <span>
                                                Gửi lại mã sau{" "}
                                                <strong>{countdown}s</strong>
                                            </span>
                                        ) : (
                                            <span>Bạn không nhận được mã?</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="otp-extra__resend"
                                        onClick={handleResendOtp}
                                        disabled={countdown > 0 || isSending}
                                    >
                                        Gửi lại mã
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={isSending}
                        >
                            {step === "PHONE"
                                ? isSending
                                    ? "Đang gửi mã..."
                                    : "Gửi mã OTP"
                                : "Xác nhận OTP"}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="login-footer">
                        <p className="login-footer__text">
                            Đã có tài khoản?{" "}
                            <a href="#" className="login-footer__link">
                                Đăng nhập ngay
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
