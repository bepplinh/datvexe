import axiosClient from "../apis/axiosClient";

export const validateCoupon = async (code, orderAmount = 0) => {
    const payload = {
        code,
        order_amount: orderAmount,
    };

    const res = await axiosClient.post("/coupons/validate", payload);
    return res.data;
};