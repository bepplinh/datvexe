import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, XCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchRoutes,
    createRoute as createRouteThunk,
    updateRoute as updateRouteThunk,
    deleteRoute as deleteRouteThunk,
} from "../../../store/slices/routeSlice";
import CircularIndeterminate from "../../../components/Loading/Loading";
import RouteDataGrid from "./components/RouteDataGrid";
import RouteFilters from "./components/RouteFilters";
import RouteForm from "./components/RouteForm";
import "./Route.scss";
import { getErrorMessage } from "../../../utils/error";
import { getRouteCityId, getRouteCityName } from "../../../utils/route";

const AdminRoutePage = () => {
    const dispatch = useAppDispatch();
    const { routes, loading, error } = useAppSelector((state) => state.route);

    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        from_city: "",
        to_city: "",
        created_from: "",
        created_to: "",
    });
    const [sortOption, setSortOption] = useState("newest");
    const [activeQuickFilter, setActiveQuickFilter] = useState("all");
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [editingRoute, setEditingRoute] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [routeToDelete, setRouteToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        dispatch(fetchRoutes());
    }, [dispatch]);

    const reverseMap = useMemo(() => {
        const map = new Map();
        routes.forEach((route) => {
            const fromId = getRouteCityId(route, "from");
            const toId = getRouteCityId(route, "to");
            if (!fromId || !toId) return;
            const key = `${fromId}-${toId}`;
            map.set(key, false);
        });
        routes.forEach((route) => {
            const fromId = getRouteCityId(route, "from");
            const toId = getRouteCityId(route, "to");
            if (!fromId || !toId) return;
            const key = `${fromId}-${toId}`;
            const reverseKey = `${toId}-${fromId}`;
            if (map.has(reverseKey)) {
                map.set(key, true);
                map.set(reverseKey, true);
            }
        });
        return map;
    }, [routes]);

    const stats = useMemo(() => {
        const uniqueOrigins = new Set();
        const uniqueDestinations = new Set();
        let twoWayCount = 0;

        routes.forEach((route) => {
            const fromId = getRouteCityId(route, "from");
            const toId = getRouteCityId(route, "to");
            if (fromId) uniqueOrigins.add(fromId);
            if (toId) uniqueDestinations.add(toId);
            if (fromId && toId) {
                const key = `${fromId}-${toId}`;
                if (reverseMap.get(key)) {
                    twoWayCount += 1;
                }
            }
        });

        return [
            { label: "Tổng số tuyến", value: routes.length, accent: "primary" },
            {
                label: "Điểm xuất phát",
                value: uniqueOrigins.size,
                accent: "success",
            },
            {
                label: "Điểm đến",
                value: uniqueDestinations.size,
                accent: "info",
            },
            {
                label: "Tuyến 2 chiều",
                value: Math.floor(twoWayCount / 2),
                accent: "warning",
            },
        ];
    }, [routes, reverseMap]);

    useEffect(() => {
        let result = routes.map((route) => {
            const fromId = getRouteCityId(route, "from");
            const toId = getRouteCityId(route, "to");
            const key = fromId && toId ? `${fromId}-${toId}` : null;
            return {
                ...route,
                hasReverse: key ? reverseMap.get(key) : false,
            };
        });

        if (filters.from_city) {
            result = result.filter(
                (route) =>
                    String(getRouteCityId(route, "from")) ===
                    String(filters.from_city)
            );
        }

        if (filters.to_city) {
            result = result.filter(
                (route) =>
                    String(getRouteCityId(route, "to")) ===
                    String(filters.to_city)
            );
        }

        if (filters.created_from) {
            const fromDate = new Date(filters.created_from);
            result = result.filter((route) => {
                const createdAt = new Date(route.created_at);
                return createdAt >= fromDate;
            });
        }

        if (filters.created_to) {
            const toDate = new Date(filters.created_to);
            toDate.setHours(23, 59, 59, 999);
            result = result.filter((route) => {
                const createdAt = new Date(route.created_at);
                return createdAt <= toDate;
            });
        }

        if (searchQuery.trim()) {
            const keyword = searchQuery.toLowerCase();
            result = result.filter((route) => {
                const routeName = route.name || "";
                const fromName = getRouteCityName(route, "from", "");
                const toName = getRouteCityName(route, "to", "");
                return (
                    routeName.toLowerCase().includes(keyword) ||
                    fromName.toLowerCase().includes(keyword) ||
                    toName.toLowerCase().includes(keyword)
                );
            });
        }

        if (activeQuickFilter === "two-way") {
            result = result.filter((route) => route.hasReverse);
        } else if (activeQuickFilter === "one-way") {
            result = result.filter((route) => !route.hasReverse);
        } else if (activeQuickFilter === "recent") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            result = result.filter((route) => {
                const createdAt = new Date(route.created_at);
                return createdAt >= thirtyDaysAgo;
            });
        }

        result.sort((a, b) => {
            if (sortOption === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortOption === "name-desc") {
                return (b.name || "").localeCompare(a.name || "");
            }
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            if (sortOption === "oldest") {
                return dateA - dateB;
            }
            return dateB - dateA;
        });

        setFilteredRoutes(result);
    }, [
        routes,
        filters,
        searchQuery,
        sortOption,
        activeQuickFilter,
        reverseMap,
    ]);

    const quickFilters = [
        { key: "all", label: "Tất cả tuyến" },
        { key: "two-way", label: "Có chiều về" },
        { key: "one-way", label: "Chỉ một chiều" },
        { key: "recent", label: "30 ngày qua" },
    ];

    const handleQuickFilter = (filter) => {
        setActiveQuickFilter(filter.key);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            from_city: "",
            to_city: "",
            created_from: "",
            created_to: "",
        });
    };

    const handleAddRoute = () => {
        setFormMode("create");
        setEditingRoute(null);
        setFormOpen(true);
    };

    const handleEditRoute = (route) => {
        setFormMode("edit");
        setEditingRoute(route);
        setFormOpen(true);
    };

    const handleViewRoute = (route) => {
        setSelectedRoute(route);
    };

    const handleFormSubmit = async (formData) => {
        if (formMode === "edit" && editingRoute) {
            await dispatch(
                updateRouteThunk({
                    id: editingRoute.id,
                    routeData: formData,
                })
            ).unwrap();
        } else {
            await dispatch(createRouteThunk(formData)).unwrap();
        }
        setFormOpen(false);
        setEditingRoute(null);
        dispatch(fetchRoutes());
    };

    const handleDeleteRequest = (route) => {
        setRouteToDelete(route);
        setDeleteDialogOpen(true);
        setDeleteError("");
    };

    const handleConfirmDelete = async () => {
        if (!routeToDelete) return;
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await dispatch(deleteRouteThunk(routeToDelete.id)).unwrap();
            setDeleteDialogOpen(false);
            setRouteToDelete(null);
        } catch (err) {
            setDeleteError(
                getErrorMessage(
                    err,
                    "Không thể xóa tuyến đường. Vui lòng thử lại."
                )
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        if (deleteLoading) return;
        setDeleteDialogOpen(false);
        setRouteToDelete(null);
        setDeleteError("");
    };

    return (
        <div className="route-management">
            <div className="route-management__container">
                <div className="route-management__header">
                    <div>
                        <h1 className="route-management__title">
                            Quản lý tuyến đường
                        </h1>
                        <p className="route-management__subtitle">
                            Theo dõi và vận hành tất cả tuyến đường trong hệ
                            thống
                        </p>
                    </div>
                    <button
                        className="route-management__add-btn"
                        onClick={handleAddRoute}
                    >
                        <Plus size={20} />
                        <span>Thêm tuyến mới</span>
                    </button>
                </div>

                {/* <div className="route-management__stats">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className={`route-management__stat route-management__stat--${item.accent}`}
                        >
                            <span className="route-management__stat-label">
                                {item.label}
                            </span>
                            <span className="route-management__stat-value">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div> */}

                <div className="route-management__actions">
                    <div className="route-management__actions-left">
                        <div className="route-management__search">
                            <label htmlFor="route-search">
                                Tìm kiếm tuyến đường
                            </label>
                            <div className="route-management__search-input">
                                <Search size={18} color="#6c757d" />
                                <input
                                    id="route-search"
                                    type="text"
                                    placeholder="Nhập tên tuyến, điểm đi hoặc đến..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="route-management__quick-filters">
                            {quickFilters.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    className={`route-management__chip ${activeQuickFilter === filter.key
                                        ? "route-management__chip--active"
                                        : ""
                                        }`}
                                    onClick={() => handleQuickFilter(filter)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="route-management__sort">
                            <label htmlFor="route-sort">Sắp xếp</label>
                            <select
                                id="route-sort"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                                <option value="name-asc">Tên A-Z</option>
                                <option value="name-desc">Tên Z-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="route-management__actions-right">
                        <RouteFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={handleResetFilters}
                        />
                    </div>
                </div>

                <div className="route-management__content">
                    {loading ? (
                        <div className="route-management__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : error ? (
                        <div className="route-management__empty">
                            <p style={{ color: "#dc3545" }}>{error}</p>
                            <button
                                type="button"
                                className="route-management__reset-btn"
                                onClick={() => dispatch(fetchRoutes())}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <RouteDataGrid
                            routes={filteredRoutes}
                            onView={handleViewRoute}
                            onEdit={handleEditRoute}
                            onDelete={handleDeleteRequest}
                        />
                    )}


                </div>

                <RouteForm
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={formMode === "edit" ? editingRoute : null}
                />
            </div>

            {deleteDialogOpen && (
                <div className="route-management__confirm-overlay">
                    <div className="route-management__confirm-modal">
                        <h3>Xóa tuyến đường</h3>
                        <p>
                            Bạn có chắc muốn xóa{" "}
                            <strong>
                                {routeToDelete?.name ||
                                    `${getRouteCityName(
                                        routeToDelete,
                                        "from",
                                        ""
                                    )} → ${getRouteCityName(
                                        routeToDelete,
                                        "to",
                                        ""
                                    )}`}
                            </strong>
                            ? Hành động này không thể hoàn tác.
                        </p>
                        {deleteError && (
                            <p className="route-management__confirm-error">
                                {deleteError}
                            </p>
                        )}
                        <div className="route-management__confirm-actions">
                            <button
                                type="button"
                                className="route-management__confirm-btn route-management__confirm-btn--cancel"
                                onClick={handleCloseDeleteDialog}
                                disabled={deleteLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="route-management__confirm-btn route-management__confirm-btn--danger"
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRoutePage;
