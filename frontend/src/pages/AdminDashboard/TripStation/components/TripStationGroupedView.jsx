import React, { useState, useMemo } from "react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import "./TripStationGroupedView.scss";

const TripStationGroupedView = ({
    tripStations = [],
    loading = false,
    onEdit,
    onDelete,
    locations = [],
    groupBy = "from", // 'from' or 'to'
}) => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [allExpanded, setAllExpanded] = useState(false);

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

    // Group stations by location
    const groupedStations = useMemo(() => {
        const groups = {};

        tripStations.forEach((station) => {
            const locationId = groupBy === "from"
                ? station.from_location_id
                : station.to_location_id;

            if (!groups[locationId]) {
                groups[locationId] = {
                    locationId,
                    locationName: getLocationName(locationId),
                    stations: [],
                    minPrice: Infinity,
                    maxPrice: 0,
                    avgDuration: 0,
                };
            }

            groups[locationId].stations.push(station);
            groups[locationId].minPrice = Math.min(groups[locationId].minPrice, station.price || 0);
            groups[locationId].maxPrice = Math.max(groups[locationId].maxPrice, station.price || 0);
        });

        // Calculate average duration for each group
        Object.values(groups).forEach((group) => {
            const totalDuration = group.stations.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
            group.avgDuration = group.stations.length > 0
                ? Math.round(totalDuration / group.stations.length)
                : 0;
        });

        // Sort groups by station count (descending)
        return Object.values(groups).sort((a, b) => b.stations.length - a.stations.length);
    }, [tripStations, groupBy, locations]);

    const handleAccordionChange = (locationId) => (event, isExpanded) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [locationId]: isExpanded,
        }));
    };

    const toggleAllGroups = () => {
        const newState = !allExpanded;
        setAllExpanded(newState);
        const newExpandedGroups = {};
        groupedStations.forEach((group) => {
            newExpandedGroups[group.locationId] = newState;
        });
        setExpandedGroups(newExpandedGroups);
    };

    if (loading && tripStations.length === 0) {
        return (
            <Box className="trip-station-grouped__loading">
                <CircularProgress />
            </Box>
        );
    }

    if (groupedStations.length === 0) {
        return (
            <Box className="trip-station-grouped__empty">
                <LocationOnIcon className="trip-station-grouped__empty-icon" />
                <Typography variant="h6">Không có dữ liệu</Typography>
                <Typography variant="body2" color="textSecondary">
                    Chưa có chặng nào được tạo
                </Typography>
            </Box>
        );
    }

    return (
        <div className="trip-station-grouped">
            <div className="trip-station-grouped__header">
                <Typography variant="subtitle2" className="trip-station-grouped__count">
                    {groupedStations.length} nhóm địa điểm • {tripStations.length} chặng
                </Typography>
                <Tooltip title={allExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}>
                    <IconButton
                        onClick={toggleAllGroups}
                        className="trip-station-grouped__toggle-all"
                        size="small"
                    >
                        {allExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                    </IconButton>
                </Tooltip>
            </div>

            <div className="trip-station-grouped__list">
                {groupedStations.map((group) => (
                    <Accordion
                        key={group.locationId}
                        expanded={expandedGroups[group.locationId] || false}
                        onChange={handleAccordionChange(group.locationId)}
                        className="trip-station-grouped__accordion"
                        TransitionProps={{ unmountOnExit: true }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            className="trip-station-grouped__summary"
                        >
                            <div className="trip-station-grouped__summary-content">
                                <div className="trip-station-grouped__location-info">
                                    <LocationOnIcon className="trip-station-grouped__location-icon" />
                                    <Typography className="trip-station-grouped__location-name">
                                        {group.locationName}
                                    </Typography>
                                    <Chip
                                        label={`${group.stations.length} chặng`}
                                        size="small"
                                        className="trip-station-grouped__count-chip"
                                    />
                                </div>
                                <div className="trip-station-grouped__stats">
                                    <span className="trip-station-grouped__stat trip-station-grouped__stat--price">
                                        💰 {formatPrice(group.minPrice)} - {formatPrice(group.maxPrice)}
                                    </span>
                                    <span className="trip-station-grouped__stat trip-station-grouped__stat--duration">
                                        ⏱️ TB {formatDuration(group.avgDuration)}
                                    </span>
                                </div>
                            </div>
                        </AccordionSummary>
                        <AccordionDetails className="trip-station-grouped__details">
                            <Table size="small" className="trip-station-grouped__table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            {groupBy === "from" ? "Điểm đến" : "Điểm đi"}
                                        </TableCell>
                                        <TableCell>Giá vé</TableCell>
                                        <TableCell>Thời gian</TableCell>
                                        <TableCell align="right">Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {group.stations.map((station) => (
                                        <TableRow
                                            key={station.id}
                                            className="trip-station-grouped__row"
                                        >
                                            <TableCell>
                                                <div className="trip-station-grouped__path">
                                                    {groupBy === "from" ? (
                                                        <>
                                                            <ArrowRightAltIcon className="trip-station-grouped__arrow" />
                                                            {getLocationName(station.to_location_id)}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {getLocationName(station.from_location_id)}
                                                            <ArrowRightAltIcon className="trip-station-grouped__arrow" />
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="trip-station-grouped__price-badge">
                                                    {formatPrice(station.price)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="trip-station-grouped__duration-badge">
                                                    {formatDuration(station.duration_minutes)}
                                                </span>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box className="trip-station-grouped__actions">
                                                    <Tooltip title="Chỉnh sửa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => onEdit?.(station)}
                                                            className="trip-station-grouped__edit-btn"
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => onDelete?.(station)}
                                                            className="trip-station-grouped__delete-btn"
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </div>
        </div>
    );
};

export default TripStationGroupedView;
