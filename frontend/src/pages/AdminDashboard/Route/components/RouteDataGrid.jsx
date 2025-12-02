import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip, Chip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import "./RouteDataGrid.scss";
import { getRouteCityName } from "../../../../utils/route";

const RouteDataGrid = ({ routes = [], onView, onEdit, onDelete }) => {
    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 80,
        },
        {
            field: "name",
            headerName: "Tên tuyến",
            flex: 1.2,
            minWidth: 220,
        },
        {
            field: "origin",
            headerName: "Điểm xuất phát",
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <div className="route-datagrid__city">
                    <span>{params.value}</span>
                </div>
            ),
        },
        {
            field: "destination",
            headerName: "Điểm đến",
            flex: 1,
            minWidth: 180,
        },
        {
            field: "hasReverse",
            headerName: "Chiều về",
            width: 140,
            renderCell: (params) =>
                params.value ? (
                    <Chip
                        label="Có tuyến chiều về"
                        color="success"
                        size="small"
                        variant="outlined"
                    />
                ) : (
                    <Chip
                        label="Chỉ 1 chiều"
                        color="warning"
                        size="small"
                        variant="outlined"
                    />
                ),
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const route = params.row.raw;
                return (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                        }}
                    >
                        <Tooltip title="Xem chi tiết">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView?.(route);
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
                                    onEdit?.(route);
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
                                    onDelete?.(route);
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

    const rows = routes.map((route) => ({
        id: route.id,
        name:
            route.name ||
            `${getRouteCityName(route, "from", "Chưa rõ")} → ${getRouteCityName(
                route,
                "to",
                "Chưa rõ"
            )}`,
        origin: getRouteCityName(route, "from"),
        destination: getRouteCityName(route, "to"),
        hasReverse: !!route.hasReverse,
        created_at: route.created_at
            ? new Date(route.created_at).toLocaleDateString("vi-VN")
            : "N/A",
        raw: route,
    }));

    return (
        <div className="route-datagrid-wrapper">
            <Box sx={{ height: 560, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 20, 30]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 },
                        },
                    }}
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

export default RouteDataGrid;
