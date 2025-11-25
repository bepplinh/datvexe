import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "./UserDataGrid.scss";

const UserDataGrid = ({ users, onView, onEdit, onDelete }) => {
    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 70,
        },
        {
            field: "name",
            headerName: "Tên",
            width: 180,
            flex: 1,
        },
        {
            field: "username",
            headerName: "Tên đăng nhập",
            width: 150,
        },
        {
            field: "email",
            headerName: "Email",
            width: 200,
            flex: 1,
        },
        {
            field: "phone",
            headerName: "Số điện thoại",
            width: 130,
        },
        {
            field: "gender",
            headerName: "Giới tính",
            width: 110,
        },
        {
            field: "role",
            headerName: "Vai trò",
            width: 130,
        },
        {
            field: "status",
            headerName: "Trạng thái",
            width: 130,
            renderCell: (params) => {
                const status = params.row.raw?.status || "active";
                const statusClass =
                    status === "active" || !status
                        ? "status-active"
                        : status === "banned"
                        ? "status-banned"
                        : "status-inactive";
                return (
                    <span className={`user-datagrid-status ${statusClass}`}>
                        {params.value}
                    </span>
                );
            },
        },
        {
            field: "created_at",
            headerName: "Ngày đăng ký",
            width: 130,
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const user = params.row.raw;
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
                                    onView?.(user);
                                }}
                            >
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(user);
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                        window.confirm(
                                            `Bạn có chắc muốn xóa user "${user.name}"?`
                                        )
                                    ) {
                                        onDelete?.(user.id);
                                    }
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    const rows = users.map((user) => ({
        id: user.id,
        name: user.name || "Chưa có tên",
        username: user.username || "N/A",
        email: user.email || "N/A",
        phone: user.phone || "Chưa cập nhật",
        role:
            user.role === "admin"
                ? "Quản trị viên"
                : user.role === "staff"
                ? "Nhân viên"
                : "Khách hàng",
        status:
            user.status === "active" || !user.status
                ? "Đang hoạt động"
                : user.status === "banned"
                ? "Đã khóa"
                : "Tạm ngưng",
        created_at:
            user.created_at || user.createdAt
                ? new Date(
                      user.created_at || user.createdAt
                  ).toLocaleDateString("vi-VN")
                : "N/A",
        gender:
            user.gender === "male"
                ? "Nam"
                : user.gender === "female"
                ? "Nữ"
                : user.gender === "other"
                ? "Khác"
                : "Chưa cập nhật",
        raw: user, // Giữ user object gốc để dùng trong actions
    }));

    return (
        <div className="user-datagrid-wrapper">
            <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 10,
                            },
                        },
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick
                    sx={{
                        "& .MuiDataGrid-cell:focus": {
                            outline: "none",
                        },
                        "& .MuiDataGrid-row:hover": {
                            backgroundColor: "rgba(13, 110, 253, 0.04)",
                        },
                    }}
                />
            </Box>
        </div>
    );
};

export default UserDataGrid;
