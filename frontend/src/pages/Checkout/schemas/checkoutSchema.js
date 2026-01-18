import * as yup from "yup";

const phoneRegExp =
    /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

export const checkoutSchema = yup.object({
    name: yup.string().required("Vui lòng nhập họ tên hành khách"),
    phone: yup
        .string()
        .matches(phoneRegExp, "Số điện thoại không hợp lệ")
        .required("Vui lòng nhập số điện thoại hành khách"),
    countryCode: yup.string().default("+84"),
    isProxyBooking: yup.boolean(),
    bookerName: yup.string().when("isProxyBooking", {
        is: true,
        then: (schema) => schema.required("Vui lòng nhập họ tên người đặt hộ"),
        otherwise: (schema) => schema.notRequired(),
    }),
    bookerPhone: yup.string().when("isProxyBooking", {
        is: true,
        then: (schema) =>
            schema
                .matches(phoneRegExp, "Số điện thoại người đặt hộ không hợp lệ")
                .required("Vui lòng nhập số điện thoại người đặt hộ"),
        otherwise: (schema) => schema.notRequired(),
    }),
    email: yup.string().email("Email không hợp lệ").notRequired(), // Optional based on current form, though usually good to have
    note: yup.string().notRequired(),
    pickup: yup.string().notRequired(),
    dropoff: yup.string().notRequired(),
});
