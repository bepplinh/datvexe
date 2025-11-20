export const formatCurrency = (value = 0) =>
    `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
