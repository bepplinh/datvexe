import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip, Chip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import "./TripDataGrid.scss";

const TripDataGrid = ({ trips = [], onView, onEdit, onDelete }) => {
    const getStatusChip = (status) => {
        const statusMap = {
            scheduled: { label: "Đã lên lịch", color: "info" },
            running: { label: "Đang chạy", color: "success" },
            finished: { label: "Hoàn thành", color: "default" },
            cancelled: { label: "Đã hủy", color: "error" },
        };

        const statusInfo = statusMap[status] || {
            label: status || "N/A",
            color: "default",
        };

        return (
            <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                variant="outlined"
            />
        );
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return "N/A";
        try {
            return new Date(dateTime).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateTime;
        }
    };

    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 80,
        },
        {
            field: "route",
            headerName: "Tuyến đường",
            flex: 1.2,
            minWidth: 200,
            renderCell: (params) => {
                const route = params.row.raw?.route;
                if (!route) return "N/A";
                return route.name || `Tuyến #${route.id}`;
            },
        },
        {
            field: "bus",
            headerName: "Xe bus",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                const bus = params.row.raw?.bus;
                if (!bus) return "Chưa gán";
                return bus.license_plate || `Xe #${bus.id}`;
            },
        },
        {
            field: "departure_time",
            headerName: "Thời gian khởi hành",
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <div className="trip-datagrid__datetime">
                    {formatDateTime(params.value)}
                </div>
            ),
        },
        {
            field: "status",
            headerName: "Trạng thái",
            width: 140,
            renderCell: (params) => getStatusChip(params.value),
        },
        {
            field: "created_at",
            headerName: "Ngày tạo",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                if (!params.value) return "N/A";
                try {
                    return new Date(params.value).toLocaleDateString("vi-VN");
                } catch {
                    return params.value;
                }
            },
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const trip = params.row.raw;
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
                                    onView?.(trip);
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
                                    onEdit?.(trip);
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
                                    onDelete?.(trip);
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

    const rows = trips.map((trip) => ({
        id: trip.id,
        route: trip.route?.name || `Tuyến #${trip.route_id}`,
        bus: trip.bus?.license_plate || "Chưa gán",
        departure_time: trip.departure_time,
        status: trip.status || "scheduled",
        created_at: trip.created_at,
        raw: trip,
    }));

    return (
        <div className="trip-datagrid-wrapper">
            <Box sx={{ height: 560, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 20, 30, 50]}
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

export default TripDataGrid;

