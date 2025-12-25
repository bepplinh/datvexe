import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "./PaymentDataGrid.scss";

const PaymentDataGrid = ({ payments, onView, loading }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getProviderLabel = (provider) => {
        const labels = {
            payos: "PayOS",
            vnpay: "VNPay",
            momo: "MoMo",
            cash: "Tiền mặt",
            bank_transfer: "Chuyển khoản",
        };
        return labels[provider] || provider || "-";
    };

    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 70,
        },
        {
            field: "booking_code",
            headerName: "Mã đặt vé",
            width: 140,
            renderCell: (params) => {
                return (
                    <span style={{ fontWeight: 600, color: "#0d6efd" }}>
                        {params.row.booking?.code || "-"}
                    </span>
                );
            },
        },
        {
            field: "customer",
            headerName: "Khách hàng",
            width: 200,
            renderCell: (params) => {
                const booking = params.row.booking;
                const customerName =
                    booking?.passenger_name ||
                    booking?.user?.name ||
                    booking?.user?.username ||
                    "-";
                return <span>{customerName}</span>;
            },
        },
        {
            field: "amount",
            headerName: "Số tiền",
            width: 150,
            renderCell: (params) => {
                return (
                    <span style={{ fontWeight: 600, color: "#28a745" }}>
                        {formatCurrency(params.value)}
                    </span>
                );
            },
        },
        {
            field: "provider",
            headerName: "Phương thức",
            width: 130,
            renderCell: (params) => {
                return (
                    <span className="payment-provider">
                        {getProviderLabel(params.value)}
                    </span>
                );
            },
        },
        {
            field: "transaction_id",
            headerName: "Mã giao dịch",
            width: 240,
            renderCell: (params) => {
                return (
                    <span
                        style={{
                            fontFamily: "monospace",
                            fontSize: "0.875rem",
                            color: "#6c757d",
                        }}
                    >
                        {params.row.provider_txn_id || "-"}
                    </span>
                );
            },
        },
        {
            field: "payment_time",
            headerName: "Thời gian thanh toán",
            width: 180,
            renderCell: (params) => {
                const createdAt = params.row?.booking?.created_at;
                return <span>{formatDate(createdAt)}</span>;
            },
        },
        {
            field: "status",
            headerName: "Trạng thái",
            width: 130,
            renderCell: (params) => {
                const status = params.row.booking?.status || "pending";
                const statusConfig = {
                    paid: { label: "Đã thanh toán", class: "status-success" },
                    pending: {
                        label: "Chờ thanh toán",
                        class: "status-warning",
                    },
                    cancelled: {
                        label: "Đã hủy",
                        class: "status-danger",
                    },
                    failed: { label: "Thất bại", class: "status-danger" },
                };

                const config = statusConfig[status] || {
                    label: status,
                    class: "status-default",
                };

                return (
                    <span
                        className={`payment-status ${config.class}`}
                    >
                        {config.label}
                    </span>
                );
            },
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                return (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        <Tooltip title="Xem chi tiết">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView?.(params.row);
                                }}
                            >
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    const rows = payments.map((payment) => ({
        id: payment.id,
        ...payment,
    }));

    console.log(rows);

    return (
        <div className="payment-datagrid-wrapper">
            <DataGrid
                rows={rows}
                columns={columns}
                pageSize={20}
                rowsPerPageOptions={[20, 50, 100]}
                disableSelectionOnClick
                loading={loading}
                autoHeight
                sx={{
                    border: "none",
                    "& .MuiDataGrid-cell:focus": {
                        outline: "none",
                    },
                    "& .MuiDataGrid-row:hover": {
                        cursor: "pointer",
                    },
                }}
            />
        </div>
    );
};

export default PaymentDataGrid;

