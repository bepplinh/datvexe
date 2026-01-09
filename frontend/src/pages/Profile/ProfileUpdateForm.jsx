import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { profileSchema } from "../../validation/profileSchema.js";
import axiosClient from "../../apis/axiosClient.js";
import { textFields, genderOptions } from "./data.js";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";

function ProfileUpdateForm({ initialData = {}, onSuccess }) {
    const {
        register,
        handleSubmit,
        setError,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            name: "",
            username: "",
            birthday: "",
            email: "",
            gender: "",
        },
    });

    const normalizedInitial = useMemo(() => {
        return {
            name: initialData?.name || "",
            username: initialData?.username || "",
            birthday: initialData?.birthday
                ? dayjs(initialData.birthday).format("YYYY-MM-DD")
                : "",
            email: initialData?.email || "",
            gender: initialData?.gender || "",
        };
    }, [initialData]);

    useEffect(() => {
        reset(normalizedInitial);
    }, [normalizedInitial, reset]);

    const onSubmit = async (values) => {
        try {
            const res = await axiosClient.put("/info/update", values);
            const payload = res?.data?.data ?? res?.data ?? values;
            const normalized = {
                name: payload?.name ?? values.name,
                username: payload?.username ?? values.username,
                birthday: payload?.birthday
                    ? dayjs(payload.birthday).format("YYYY-MM-DD")
                    : "",
                email: payload?.email ?? values.email,
                gender: payload?.gender ?? values.gender,
            };
            reset(normalized);
            onSuccess && onSuccess(res.data);
            toast.success("Cập nhật thành công!");
        } catch (e) {
            if (e.response?.status === 422) {
                const apiErr = e.response.data.errors || {};
                Object.keys(apiErr).forEach((field) => {
                    setError(field, {
                        type: "server",
                        message: apiErr[field][0],
                    });
                });
            } else {
                toast.error("Đã có lỗi xảy ra, vui lòng thử lại !");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
            {textFields.map((f) => {
                const reg = register(f.name);
                const fieldError = errors[f.name]?.message;
                return (
                    <div key={f.name} className="profile-form__field">
                        <label htmlFor={f.name} className="profile-form__label">
                            {f.label}
                        </label>
                        <div className="profile-form__input-wrapper">
                            <input
                                id={f.name}
                                type={f.type}
                                placeholder={f.placeholder}
                                className={`profile-form__input ${fieldError ? "profile-form__input--error" : ""}`}
                                {...reg}
                            />
                            {f.name === "name" && (
                                <span className="profile-form__input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </span>
                            )}
                            {f.name === "username" && (
                                <span className="profile-form__input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </span>
                            )}
                            {f.name === "email" && (
                                <span className="profile-form__input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                    </svg>
                                </span>
                            )}
                            {f.name === "birthday" && (
                                <span className="profile-form__input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                        <line x1="16" x2="16" y1="2" y2="6"></line>
                                        <line x1="8" x2="8" y1="2" y2="6"></line>
                                        <line x1="3" x2="21" y1="10" y2="10"></line>
                                    </svg>
                                </span>
                            )}
                        </div>
                        {fieldError && (
                            <span className="profile-form__error">{fieldError}</span>
                        )}
                    </div>
                );
            })}

            <div className="profile-form__field">
                <p className="profile-form__label">Giới tính</p>
                <div className="profile-form__gender-select">
                    {genderOptions.map((opt) => (
                        <label
                            key={opt.value}
                            className={`profile-form__gender-option${watch("gender") === opt.value
                                    ? " profile-form__gender-option--active"
                                    : ""
                                }`}
                        >
                            <input
                                className="profile-form__gender-radio"
                                type="radio"
                                value={opt.value}
                                {...register("gender")}
                            />
                            {opt.value === "male" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10" cy="14" r="5"></circle>
                                    <line x1="19" y1="5" x2="13.5" y2="10.5"></line>
                                    <polyline points="15 4 20 4 20 9"></polyline>
                                </svg>
                            )}
                            {opt.value === "female" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="5"></circle>
                                    <line x1="12" y1="13" x2="12" y2="21"></line>
                                    <line x1="9" y1="18" x2="15" y2="18"></line>
                                </svg>
                            )}
                            {opt.value === "other" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v.01"></path>
                                    <path d="M12 8c.828 0 1.5.627 1.5 1.4 0 .592-.339 1.1-.796 1.378-.608.37-.704.635-.704 1.222"></path>
                                </svg>
                            )}
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>
                {errors.gender?.message && (
                    <span className="profile-form__error">
                        {errors.gender.message}
                    </span>
                )}
            </div>

            <div className="profile-form__actions">
                <button
                    type="button"
                    disabled={isSubmitting}
                    className="profile-form__btn profile-form__btn--cancel"
                    onClick={() => reset(normalizedInitial)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    Hủy thay đổi
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="profile-form__btn profile-form__btn--submit"
                >
                    {isSubmitting ? (
                        <>
                            <span className="profile-form__spinner"></span>
                            Đang cập nhật...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            Lưu thay đổi
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export default ProfileUpdateForm;
