import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import "./BusTypeDataGrid.scss";

const BusTypeDataGrid = ({ busTypes, onEdit, onDelete }) => {
    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 70,
        },
        {
            field: "name",
            headerName: "Tên loại xe",
            width: 250,
            flex: 1,
        },
        {
            field: "seat_count",
            headerName: "Số ghế",
            width: 120,
            renderCell: (params) => {
                return <span>{params.value || 0} ghế</span>;
            },
        },
        {
            field: "created_at",
            headerName: "Ngày tạo",
            width: 150,
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
                const busType = params.row.raw;
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
                        <Tooltip title="Chỉnh sửa">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(busType);
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
                                    onDelete?.(busType);
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

    const rows = (busTypes || []).map((busType) => {
        return {
            id: busType.id,
            name: busType.name || "Chưa có tên",
            seat_count: busType.seat_count || 0,
            created_at:
                busType.created_at || busType.createdAt
                    ? new Date(
                          busType.created_at || busType.createdAt
                      ).toLocaleDateString("vi-VN")
                    : "N/A",
            raw: busType, // Giữ busType object gốc để dùng trong actions
        };
    });

    return (
        <div className="bus-type-datagrid-wrapper">
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

export default BusTypeDataGrid;

