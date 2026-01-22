import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { authService } from "../../services/authService";
import "./Register.scss";

const OTP_COUNTDOWN = 60;

const formatPhoneToE164 = (phone) => {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
        return "+84" + cleaned.substring(1);
    }
    if (cleaned.startsWith("84")) {
        return "+" + cleaned;
    }
    if (cleaned.length > 0) {
        return "+84" + cleaned;
    }
    return phone;
};

// Yup schema cho step COMPLETE
const registerSchema = yup.object().shape({
    username: yup
        .string()
        .required("Vui lòng nhập tên đăng nhập")
        .min(4, "Tên đăng nhập phải có ít nhất 4 ký tự")
        .max(32, "Tên đăng nhập tối đa 32 ký tự")
        .matches(
            /^[a-zA-Z0-9_-]+$/,
            "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và gạch ngang"
        ),
    password: yup
        .string()
        .required("Vui lòng nhập mật khẩu")
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .matches(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ in hoa")
        .matches(
            /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/,
            "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)"
        ),
    confirmPassword: yup
        .string()
        .required("Vui lòng xác nhận mật khẩu")
        .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp"),
    name: yup.string().max(255, "Họ và tên tối đa 255 ký tự"),
    email: yup.string().email("Email không hợp lệ"),
    birthday: yup.string(),
});

const RegisterPage = () => {
    const [step, setStep] = useState("PHONE"); // PHONE | OTP | COMPLETE
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [registerToken, setRegisterToken] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [isSending, setIsSending] = useState(false);

    // React Hook Form for step COMPLETE
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            username: "",
            password: "",
            confirmPassword: "",
            name: "",
            email: "",
            birthday: "",
        },
    });

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
            toast.error("Vui lòng nhập số điện thoại");
            return;
        }

        try {
            setIsSending(true);
            const formattedPhone = formatPhoneToE164(phone);

            await authService.sendOtp({
                phone: formattedPhone,
                purpose: "register",
                channel: "sms",
            });

            toast.success("Đã gửi mã OTP đến số điện thoại của bạn");
            setStep("OTP");
            setCountdown(OTP_COUNTDOWN);
        } catch (error) {
            console.error(error);
            const message =
                error.response?.data?.message ||
                "Gửi OTP thất bại, vui lòng thử lại.";
            toast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length < 4) {
            toast.error("Vui lòng nhập mã OTP hợp lệ");
            return;
        }

        try {
            setIsSending(true);
            const formattedPhone = formatPhoneToE164(phone);

            const result = await authService.verifyOtp({
                phone: formattedPhone,
                code: otp,
                purpose: "register",
            });

            if (result.success && result.register_token) {
                setRegisterToken(result.register_token);
                toast.success("Xác thực OTP thành công!");
                setStep("COMPLETE");
            } else {
                toast.error("Xác thực OTP thất bại");
            }
        } catch (error) {
            console.error(error);
            const message =
                error.response?.data?.message ||
                "Mã OTP không hợp lệ hoặc đã hết hạn";
            toast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const handleCompleteRegister = async (formData) => {
        try {
            setIsSending(true);

            const result = await authService.completeRegister({
                registerToken,
                username: formData.username,
                password: formData.password,
                name: formData.name || null,
                email: formData.email || null,
                birthday: formData.birthday || null,
            });

            if (result.token) {
                toast.success("Đăng ký thành công!");
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
            }
        } catch (error) {
            console.error(error);
            const errorData = error.response?.data;
            let message = "Đăng ký thất bại, vui lòng thử lại.";

            if (errorData?.errors) {
                const firstError = Object.values(errorData.errors)[0]?.[0];
                if (firstError) message = firstError;
            } else if (errorData?.message) {
                message = errorData.message;
            }

            toast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (step === "PHONE") {
            handleSendOtp();
        } else if (step === "OTP") {
            handleVerifyOtp();
        }
        // Step COMPLETE is handled by react-hook-form's handleSubmit
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
                                {step === "PHONE"
                                    ? "Đăng ký tài khoản mới"
                                    : step === "OTP"
                                        ? "Xác thực OTP"
                                        : "Hoàn tất đăng ký"}
                            </p>
                            <p className="login-card__subtitle">
                                {step === "PHONE"
                                    ? "Nhập số điện thoại để nhận mã OTP xác thực."
                                    : step === "OTP"
                                        ? "Nhập mã OTP đã được gửi đến số điện thoại của bạn."
                                        : "Vui lòng điền thông tin để hoàn tất đăng ký."}
                            </p>
                        </div>
                    </div>

                    {/* Form for PHONE & OTP steps */}
                    {step !== "COMPLETE" && (
                        <form className="login-form" onSubmit={handleFormSubmit}>
                            {/* Step PHONE: Nhập số điện thoại */}
                            {step === "PHONE" && (
                                <div className="login-form__field">
                                    <label className="login-form__label">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        className="login-form__input"
                                        placeholder="Nhập số điện thoại (VD: 0901234567)"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Step OTP: Nhập mã OTP */}
                            {step === "OTP" && (
                                <>
                                    <div className="login-form__field">
                                        <label className="login-form__label">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            className="login-form__input"
                                            value={phone}
                                            disabled
                                        />
                                    </div>
                                    <div className="login-form__field">
                                        <label className="login-form__label">
                                            Mã OTP
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={8}
                                            className="login-form__input"
                                            placeholder="Nhập mã OTP"
                                            value={otp}
                                            onChange={(e) =>
                                                setOtp(e.target.value.replace(/\D/g, ""))
                                            }
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
                                </>
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
                                    : isSending
                                        ? "Đang xác thực..."
                                        : "Xác nhận OTP"}
                            </button>
                        </form>
                    )}

                    {/* Form for COMPLETE step with react-hook-form */}
                    {step === "COMPLETE" && (
                        <form
                            className="login-form"
                            onSubmit={handleSubmit(handleCompleteRegister)}
                        >
                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Tên đăng nhập <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`login-form__input ${errors.username ? "login-form__input--error" : ""}`}
                                    placeholder="Tên đăng nhập (tối thiểu 4 ký tự)"
                                    {...register("username")}
                                />
                                {errors.username && (
                                    <p className="login-form__error">{errors.username.message}</p>
                                )}
                            </div>

                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Mật khẩu <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    className={`login-form__input ${errors.password ? "login-form__input--error" : ""}`}
                                    placeholder="Mật khẩu (tối thiểu 6 ký tự, có chữ in hoa và ký tự đặc biệt)"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="login-form__error">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Xác nhận mật khẩu <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    className={`login-form__input ${errors.confirmPassword ? "login-form__input--error" : ""}`}
                                    placeholder="Nhập lại mật khẩu"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="login-form__error">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Họ và tên
                                </label>
                                <input
                                    type="text"
                                    className={`login-form__input ${errors.name ? "login-form__input--error" : ""}`}
                                    placeholder="Họ và tên (tùy chọn)"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="login-form__error">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className={`login-form__input ${errors.email ? "login-form__input--error" : ""}`}
                                    placeholder="Email (tùy chọn)"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="login-form__error">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="login-form__field">
                                <label className="login-form__label">
                                    Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    className="login-form__input"
                                    {...register("birthday")}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={isSending}
                            >
                                {isSending ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="login-footer">
                        <p className="login-footer__text">
                            Đã có tài khoản?{" "}
                            <Link to="/login" className="login-footer__link">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
