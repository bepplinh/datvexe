import React from "react";
import { Calendar, Route as RouteIcon } from "lucide-react";
import { getRouteCityName } from "../../../../utils/route";
import "./FilterPanel.scss";

const FilterPanel = ({
    routes,
    routesLoading,
    selectedRouteId,
    selectedDate,
    onRouteChange,
    onDateChange,
}) => {
    return (
        <div className="filter-panel">
            <div className="filter-panel__header">
                <h3 className="filter-panel__title">Bộ lọc</h3>
            </div>
            <div className="filter-panel__body">
                <div className="filter-panel__group">
                    <label
                        htmlFor="route-select"
                        className="filter-panel__label"
                    >
                        <RouteIcon size={18} />
                        <span>Chọn tuyến</span>
                    </label>
                    <select
                        id="route-select"
                        className="filter-panel__select"
                        value={selectedRouteId}
                        onChange={onRouteChange}
                        disabled={routesLoading}
                    >
                        <option value="">
                            {routesLoading
                                ? "Đang tải..."
                                : "-- Chọn tuyến --"}
                        </option>
                        {routes.map((route) => (
                            <option key={route.id} value={route.id}>
                                {route.name ||
                                    `${getRouteCityName(
                                        route,
                                        "from"
                                    )} → ${getRouteCityName(route, "to")}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-panel__group">
                    <label htmlFor="date-input" className="filter-panel__label">
                        <Calendar size={18} />
                        <span>Chọn ngày</span>
                    </label>
                    <input
                        id="date-input"
                        type="date"
                        className="filter-panel__date-input"
                        value={selectedDate}
                        onChange={onDateChange}
                        min={new Date().toISOString().split("T")[0]}
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;

