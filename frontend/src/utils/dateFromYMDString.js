// src/utils/dateFromYMDString.js
import { z } from "zod";

export const dateFromYMDString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải theo định dạng YYYY-MM-DD")
    .transform((val) => {
        const d = new Date(val + "T00:00:00");
        if (Number.isNaN(d.getTime())) {
            throw new Error("Ngày sinh không hợp lệ");
        }
        return d;
    });
