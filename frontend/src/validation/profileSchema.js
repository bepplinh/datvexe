import * as Yup from "yup";

export const profileSchema = Yup.object().shape({
    name: Yup.string()
        .required("Tên là bắt buộc")
        .max(255, "Tên tối đa 255 ký tự"),
    username: Yup.string()
        .required("Username là bắt buộc")
        .max(255, "Username tối đa 255 ký tự"),
    birthday: Yup.date().nullable().typeError("Ngày sinh không hợp lệ"),
    email: Yup.string().nullable().email("Email không hợp lệ"),
    gender: Yup.string().required("Giới tính là bắt buộc"),
});
