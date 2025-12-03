import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Tooltip,
    Box,
    Paper,
    CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import "./TripStationDataGrid.scss";

const TripStationDataGrid = ({
    tripStations = [],
    loading = false,
    pagination,
    sortBy,
    sortDir,
    onPageChange,
    onPerPageChange,
    onSortChange,
    onEdit,
    onDelete,
    routes = [],
    locations = [],
}) => {
    const getRouteName = (routeId) => {
        const route = routes.find((r) => r.id === routeId);
        return route?.name || `Tuyến #${routeId}`;
    };

    const getLocationName = (locationId) => {
        const location = locations.find((l) => l.id === locationId);
        return location?.name || `Địa điểm #${locationId}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price || 0) + "đ";
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const handleSort = (field) => {
        const newDir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
        onSortChange(field, newDir);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        return sortDir === "asc" ? (
            <ArrowUpwardIcon fontSize="small" />
        ) : (
            <ArrowDownwardIcon fontSize="small" />
        );
    };

    if (loading && tripStations.length === 0) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 400,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="trip-station-datagrid">
            <TableContainer component={Paper} className="trip-station-datagrid__container">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                className="trip-station-datagrid__header-cell"
                                onClick={() => handleSort("id")}
                                style={{ cursor: "pointer" }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    ID
                                    <SortIcon field="id" />
                                </Box>
                            </TableCell>
                            <TableCell
                                className="trip-station-datagrid__header-cell"
                                onClick={() => handleSort("route_id")}
                                style={{ cursor: "pointer" }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    Tuyến đường
                                    <SortIcon field="route_id" />
                                </Box>
                            </TableCell>
                            <TableCell className="trip-station-datagrid__header-cell">
                                Điểm đón
                            </TableCell>
                            <TableCell className="trip-station-datagrid__header-cell">
                                Điểm trả
                            </TableCell>
                            <TableCell
                                className="trip-station-datagrid__header-cell"
                                onClick={() => handleSort("price")}
                                style={{ cursor: "pointer" }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    Giá vé
                                    <SortIcon field="price" />
                                </Box>
                            </TableCell>
                            <TableCell
                                className="trip-station-datagrid__header-cell"
                                onClick={() => handleSort("duration_minutes")}
                                style={{ cursor: "pointer" }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    Thời gian
                                    <SortIcon field="duration_minutes" />
                                </Box>
                            </TableCell>
                            <TableCell className="trip-station-datagrid__header-cell">
                                Thao tác
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tripStations.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    align="center"
                                    className="trip-station-datagrid__empty"
                                >
                                    {loading ? "Đang tải..." : "Không có dữ liệu"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            tripStations.map((station) => (
                                <TableRow
                                    key={station.id}
                                    className="trip-station-datagrid__row"
                                    hover
                                >
                                    <TableCell>{station.id}</TableCell>
                                    <TableCell>
                                        <div className="trip-station-datagrid__route">
                                            {getRouteName(station.route_id)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="trip-station-datagrid__location">
                                            {getLocationName(station.from_location_id)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="trip-station-datagrid__location">
                                            {getLocationName(station.to_location_id)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="trip-station-datagrid__price">
                                            {formatPrice(station.price)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="trip-station-datagrid__duration">
                                            {formatDuration(station.duration_minutes)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Tooltip title="Chỉnh sửa">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => onEdit?.(station)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => onDelete?.(station)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {pagination && (
                <TablePagination
                    component="div"
                    count={pagination.total}
                    page={pagination.page - 1}
                    onPageChange={(e, newPage) => onPageChange(newPage + 1)}
                    rowsPerPage={pagination.per_page}
                    onRowsPerPageChange={(e) =>
                        onPerPageChange(parseInt(e.target.value, 10))
                    }
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    labelRowsPerPage="Số dòng mỗi trang:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
                    }
                />
            )}
        </div>
    );
};

export default TripStationDataGrid;

