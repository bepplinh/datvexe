import React from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Tooltip, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LayoutGrid } from "lucide-react";
import "./BusDataGrid.scss";

const BusDataGrid = ({ buses, onEdit, onDelete }) => {
    const navigate = useNavigate();

    const handleOpenSeatLayout = (bus) => {
        navigate(`/admin/seat-layout?busId=${bus.id}`);
    };

    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 70,
        },
        {
            field: "code",
            headerName: "Mã xe",
            width: 120,
        },
        {
            field: "name",
            headerName: "Tên xe",
            width: 200,
            flex: 1,
        },
        {
            field: "plate_number",
            headerName: "Biển số",
            width: 130,
        },
        {
            field: "type_bus",
            headerName: "Loại xe",
            width: 180,
            renderCell: (params) => {
                const typeBus = params.row.raw?.type_bus;
                if (!typeBus) return "N/A";
                return (
                    <Chip
                        label={`${typeBus.name} (${typeBus.seat_count} ghế)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                );
            },
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 180,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const bus = params.row.raw;
                return (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        <Tooltip title="Sơ đồ ghế">
                            <IconButton
                                size="small"
                                color="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSeatLayout(bus);
                                }}
                            >
                                <LayoutGrid size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(bus);
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
                                    onDelete?.(bus);
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

    const rows = (buses || []).map((bus) => {
        return {
            id: bus.id,
            code: bus.code || "N/A",
            name: bus.name || "Chưa có tên",
            plate_number: bus.plate_number || "N/A",
            type_bus: bus.type_bus || null,
            raw: bus, // Giữ bus object gốc để dùng trong actions
        };
    });

    return (
        <div className="bus-datagrid-wrapper">
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

export default BusDataGrid;

