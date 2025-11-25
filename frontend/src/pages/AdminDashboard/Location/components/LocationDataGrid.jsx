import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "./LocationDataGrid.scss";

const LocationDataGrid = ({ locations, onView, onEdit, onDelete }) => {
    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 70,
        },
        {
            field: "name",
            headerName: "Tên địa điểm",
            width: 200,
            flex: 1,
        },
        {
            field: "type",
            headerName: "Loại",
            width: 130,
            renderCell: (params) => {
                const type = params.value || "";
                const typeLabels = {
                    city: "Thành phố",
                    district: "Quận/Huyện",
                    ward: "Phường/Xã",
                };
                const typeClass =
                    type === "city"
                        ? "type-city"
                        : type === "district"
                        ? "type-district"
                        : "type-ward";
                return (
                    <span className={`location-datagrid-type ${typeClass}`}>
                        {typeLabels[type] || type}
                    </span>
                );
            },
        },
        {
            field: "parent",
            headerName: "Địa điểm cha",
            width: 180,
            renderCell: (params) => {
                const location = params.row.raw;
                return location?.parent?.name || "N/A";
            },
        },
        {
            field: "created_at",
            headerName: "Ngày tạo",
            width: 130,
            renderCell: (params) => {
                const date = params.value || params.row.raw?.created_at;
                return date
                    ? new Date(date).toLocaleDateString("vi-VN")
                    : "N/A";
            },
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const location = params.row.raw;
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
                                    onView?.(location);
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
                                    onEdit?.(location);
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
                                    onDelete?.(location);
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

    const rows = (locations || []).map((location) => {
        return {
            id: location.id,
            name: location.name || "Chưa có tên",
            type: location.type || "N/A",
            parent: location.parent?.name || location.parent_name || "N/A",
            created_at:
                location.created_at || location.createdAt
                    ? new Date(
                          location.created_at || location.createdAt
                      ).toLocaleDateString("vi-VN")
                    : "N/A",
            raw: location, // Giữ location object gốc để dùng trong actions
        };
    });

    return (
        <div className="location-datagrid-wrapper">
            <Box
                sx={{
                    height: 600,
                    width: "100%",
                    "@media (max-width: 768px)": {
                        height: 420,
                    },
                }}
            >
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

export default LocationDataGrid;
