import * as Yup from "yup";

export const createBookingSchema = Yup.object().shape({
    customer_name: Yup.string().required("Vui lòng nhập tên khách hàng").trim(),
    customer_phone: Yup.string()
        .required("Vui lòng nhập số điện thoại")
        .matches(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
        .trim(),
    customer_email: Yup.string()
        .nullable()
        .email("Email không hợp lệ")
        .transform((value) => (value === "" ? null : value)),
    // Các field from_location_id / to_location_id đã được đảm bảo ở backend (AdminBookingRequest),
    // nên phía form admin chỉ cần validate thông tin khách; ID sẽ lấy từ trip hiện tại.
    from_location_id: Yup.string().nullable(),
    to_location_id: Yup.string().nullable(),
    note: Yup.string()
        .nullable()
        .transform((value) => (value === "" ? null : value)),
});
