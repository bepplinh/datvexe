import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { profileSchema } from "../../validation/profileSchema.js";
import axiosClient from "../../apis/axiosClient.js";
import { textFields, genderOptions } from "./data.js";
import { yupResolver } from "@hookform/resolvers/yup";
import InputCommon from "../../components/InputCommon/InputCommon";
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
                console.log(e);
                toast.error("Đã có lỗi xảy ra, vui lòng thử lại !");
            }
        }
        
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {textFields.map((f) => {
                const reg = register(f.name);
                const fieldError = errors[f.name]?.message;
                return (
                    <InputCommon
                        key={f.name}
                        label={f.label}
                        type={f.type}
                        name={f.name}
                        placeholder={f.placeholder}
                        {...reg}
                        error={Boolean(fieldError)}
                        helperText={fieldError}
                    />
                );
            })}

            <div className="profile-form__gender">
                <p className="profile-form__gender-title">Giới tính</p>
                <div className="profile-form__gender-select">
                    {genderOptions.map((opt) => (
                        <label
                            key={opt.value}
                            className={`profile-form__gender-option${
                                watch("gender") === opt.value
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
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>
                {errors.gender?.message && (
                    <p className="profile-form__gender-error">
                        {errors.gender.message}
                    </p>
                )}
            </div>

            <div className="profile-form__actions">
                <button
                    type="button"
                    disabled={isSubmitting}
                    className="profile-form__btn profile-form__btn--cancel"
                    onClick={() => reset(normalizedInitial)}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="profile-form__btn profile-form__btn--submit"
                >
                    {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
                </button>
            </div>
        </form>
    );
}

export default ProfileUpdateForm;
